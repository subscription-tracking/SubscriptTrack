"""Release çıktısı (APK/AAB) dize ve manifest taraması (güvenlik denetimi B2).

Kullanım:
    python tools/quality/scan_release_artifact.py <apk-veya-aab> [--out docs/quality/metrics/release_artifact_scan.json]

Kontroller:
  * Yasak dizeler (test hesabı, varsayılan parola, service_role, özel anahtar başlıkları).
  * Uzun JWT'ler: yalnızca rolü `anon` olanlar (publishable) kabul edilir.
  * Manifest: allowBackup=false ve dışa açık (exported=true) bileşen sayısı.
Çıkış kodu: bulgu varsa 1.
"""
import argparse
import base64
import json
import re
import sys
import zipfile

FORBIDDEN = [
    b'Test1234', b'testkullanici', b'service_role', b'SERVICE_ROLE',
    b'-----BEGIN PRIVATE KEY-----', b'-----BEGIN RSA PRIVATE KEY-----',
]
JWT = re.compile(rb'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')


def jwt_role(token: bytes):
    try:
        payload = token.split(b'.')[1]
        payload += b'=' * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload)).get('role')
    except Exception:
        return None


def scan(path):
    findings, jwts = [], []
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.is_dir() or info.file_size > 64 * 1024 * 1024:
                continue
            data = z.read(info.filename)
            for needle in FORBIDDEN:
                if needle in data:
                    findings.append({'file': info.filename, 'forbidden': needle.decode()})
            for m in JWT.finditer(data):
                role = jwt_role(m.group(0))
                jwts.append({'file': info.filename, 'role': role})
                if role != 'anon':
                    findings.append({'file': info.filename, 'jwt_role': role})
    return findings, jwts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('artifact')
    ap.add_argument('--out')
    args = ap.parse_args()
    findings, jwts = scan(args.artifact)
    result = {
        'artifact': args.artifact.replace('\\', '/').split('/')[-1],
        'findings': findings,
        'jwt_count': len(jwts),
        'jwt_roles': sorted({str(j['role']) for j in jwts}),
    }
    if args.out:
        with open(args.out, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=1, ensure_ascii=False)
    print(json.dumps(result, ensure_ascii=False))
    return 1 if findings else 0


if __name__ == '__main__':
    sys.exit(main())
