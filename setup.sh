#!/usr/bin/env bash
set -e

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"

echo ""
echo -e "${BOLD}SubscriptTrack — Kurulum${RESET}"
echo "──────────────────────────────────"
echo ""

# 1. Flutter kontrolü
if ! command -v flutter &> /dev/null; then
  echo -e "${RED}✗ Flutter bulunamadı.${RESET}"
  echo "  Kur: https://flutter.dev/get-started"
  exit 1
fi

FLUTTER_VERSION=$(flutter --version --machine 2>/dev/null | grep '"frameworkVersion"' | sed 's/.*: "\(.*\)".*/\1/')
echo -e "${GREEN}✓ Flutter${RESET} ${FLUTTER_VERSION:-kurulu}"

# 2. mobile/ dizinine geç
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/mobile"

# 3. .env kontrolü
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠  .env dosyası oluşturuldu: mobile/.env${RESET}"
    echo ""
    echo "   Supabase anahtarlarını girmek için dosyayı aç:"
    echo "   https://supabase.com/dashboard → Projen → Project Settings → API"
    echo ""
    echo "   Anahtarları girdikten sonra bu scripti tekrar çalıştır."
    echo ""
    exit 0
  else
    echo -e "${RED}✗ .env.example bulunamadı.${RESET}"
    exit 1
  fi
fi

# .env dolu mu?
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d'=' -f2-)
SUPABASE_KEY=$(grep "^SUPABASE_ANON_KEY=" .env | cut -d'=' -f2-)

if [ -z "$SUPABASE_URL" ] || echo "$SUPABASE_URL" | grep -q "xxxx\|your-project"; then
  echo ""
  echo -e "${YELLOW}⚠  .env dosyası dolu değil.${RESET}"
  echo ""
  echo "   mobile/.env dosyasını aç ve şu alanları doldur:"
  echo "   SUPABASE_URL=https://xxxx.supabase.co"
  echo "   SUPABASE_ANON_KEY=eyJxxx..."
  echo ""
  echo "   Supabase Dashboard → Projen → Project Settings → API"
  echo ""
  exit 0
fi

echo -e "${GREEN}✓ .env${RESET} Supabase anahtarları mevcut"

# 4. Bağımlılıkları indir
echo ""
echo -e "${CYAN}→ flutter pub get çalıştırılıyor...${RESET}"
echo ""
flutter pub get

# 5. Başarı
echo ""
echo "──────────────────────────────────"
echo -e "${GREEN}${BOLD}✓ Kurulum tamamlandı!${RESET}"
echo ""
echo "  Çalıştırmak için:"
echo ""
echo -e "  ${BOLD}make web${RESET}        Tarayıcıda aç"
echo -e "  ${BOLD}make install${RESET}    APK derle + telefona kur"
echo ""
