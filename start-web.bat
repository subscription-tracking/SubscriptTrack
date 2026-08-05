@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

cd /d "%~dp0mobile"

where flutter >nul 2>&1
if errorlevel 1 (
    echo  [HATA] Flutter bulunamadi. Kurulum: https://docs.flutter.dev/get-started/install
    pause
    exit /b 1
)

echo.
echo  SubscriptTrack — Web
echo  ────────────────────────────────
echo.

if not exist ".env" (
    echo  [!] .env bulunamadi; uygulama yerel modda baslayacak.
    echo      Supabase baglantisi icin: copy .env.example .env
    echo.
    flutter run -d chrome
    goto :eof
)

set "URL_OK=0"
for /f "tokens=2 delims==" %%a in ('findstr /i "^SUPABASE_URL=" .env') do (
    set "VAL=%%a"
    if not "!VAL!"=="" if not "!VAL!"=="https://xxxx.supabase.co" if not "!VAL!"=="https://your-project-ref.supabase.co" (
        set "URL_OK=1"
    )
)

if "!URL_OK!"=="0" (
    echo  [!] Supabase anahtarlari eksik — uygulama yerel modda baslayacak.
    echo      Baglamak icin: mobile\.env dosyasini doldur
    echo.
    flutter run -d chrome
    goto :eof
)

echo  Tarayicida aciliyor...
echo.
flutter run -d chrome --dart-define-from-file=.env
