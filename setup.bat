@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo.
echo  SubscriptTrack — Kurulum
echo  ────────────────────────────────
echo.

:: 1. Flutter kontrolü
where flutter >nul 2>&1
if errorlevel 1 (
    echo  [HATA] Flutter bulunamadi.
    echo.
    echo  Kur: https://flutter.dev/get-started
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('flutter --version 2^>nul ^| findstr /i "Flutter"') do (
    echo  [OK] %%v
    goto :flutter_ok
)
:flutter_ok

:: 2. mobile\ dizinine geç
cd /d "%~dp0mobile"

:: 3. .env kontrolü
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo.
        echo  [!] .env dosyasi olusturuldu: mobile\.env
        echo.
        echo      Supabase anahtarlarini girmek icin dosyayi ac:
        echo      https://supabase.com/dashboard - Projen - Project Settings - API
        echo.
        echo      Anahtarlari girdikten sonra bu scripti tekrar calistir.
        echo.
        pause
        exit /b 0
    ) else (
        echo  [HATA] .env.example bulunamadi.
        pause
        exit /b 1
    )
)

:: .env dolu mu?
set "URL_EMPTY=1"
for /f "tokens=2 delims==" %%a in ('findstr /i "^SUPABASE_URL=" .env') do (
    set "VAL=%%a"
    if not "!VAL!"=="" if not "!VAL!"=="https://xxxx.supabase.co" if not "!VAL!"=="https://your-project-ref.supabase.co" (
        set "URL_EMPTY=0"
    )
)

if "!URL_EMPTY!"=="1" (
    echo.
    echo  [!] .env dosyasi dolu degil.
    echo.
    echo      mobile\.env dosyasini ac ve su alanlari doldur:
    echo      SUPABASE_URL=https://xxxx.supabase.co
    echo      SUPABASE_ANON_KEY=eyJxxx...
    echo.
    echo      Supabase Dashboard - Projen - Project Settings - API
    echo.
    pause
    exit /b 0
)

echo  [OK] .env Supabase anahtarlari mevcut

:: 4. Bağımlılıkları indir
echo.
echo  flutter pub get calistiriliyor...
echo.
flutter pub get
if errorlevel 1 (
    echo.
    echo  [HATA] flutter pub get basarisiz oldu.
    pause
    exit /b 1
)

:: 5. Başarı
echo.
echo  ────────────────────────────────
echo  Kurulum tamamlandi!
echo.
echo  Calistirmak icin (mobile\ klasorunde):
echo.
echo    make web        Tarayicide ac
echo    make install    APK derle + telefona kur
echo.
echo  make yoksa (Windows):
echo    flutter run -d chrome --dart-define-from-file=.env
echo.
pause
