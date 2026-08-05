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

:: 3. .env kontrolü (isteğe bağlı; yoksa yerel mod)
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo.
        echo  [!] mobile\.env olusturuldu. Bos birakirsan uygulama yerel modda calisir.
    ) else (
        echo  [HATA] .env.example bulunamadi.
        pause
        exit /b 1
    )
)

:: .env dolu mu?
set "URL_OK=0"
for /f "tokens=2 delims==" %%a in ('findstr /i "^SUPABASE_URL=" .env') do (
    set "VAL=%%a"
    if not "!VAL!"=="" if not "!VAL!"=="https://xxxx.supabase.co" if not "!VAL!"=="https://your-project-ref.supabase.co" (
        set "URL_OK=1"
    )
)

if "!URL_OK!"=="0" (
    echo.
    echo  [!] mobile\.env doldurmani bekliyor.
    echo.
    echo      SUPABASE_URL ve SUPABASE_ANON_KEY alanlarini doldur.
    echo      https://supabase.com/dashboard - Projen - Project Settings - API
    echo.
    echo      Devam ediliyor: yerel modda kullanabilirsin.
    echo.
)

if "!URL_OK!"=="1" echo  [OK] .env Supabase anahtarlari mevcut

:: 4. Bağımlılıkları indir
echo.
echo  Bagimliliklar indiriliyor...
echo.
flutter pub get
if errorlevel 1 (
    echo.
    echo  [HATA] flutter pub get basarisiz.
    pause
    exit /b 1
)

:: 5. Başarı + seçim
echo.
echo  ────────────────────────────────
echo  Kurulum tamamlandi!
echo.
echo  Simdi ne yapmak istersin?
echo.
echo    1)  Web — Tarayicida ac (Chrome)
echo    2)  Android — APK derle + telefona kur (USB bagli olmali)
echo    3)  Cikis
echo.
set /p CHOICE="  Secim [1/2/3]: "

if "!CHOICE!"=="1" (
    echo.
    echo  Web baslatiliyor...
    echo.
    if "!URL_OK!"=="1" (
        flutter run -d chrome --dart-define-from-file=.env
    ) else (
        flutter run -d chrome
    )
    goto :eof
)

if "!CHOICE!"=="2" (
    echo.
    echo  APK derleniyor...
    echo.
    if "!URL_OK!"=="1" (
        flutter build apk --release --dart-define-from-file=.env
    ) else (
        flutter build apk --release
    )
    if errorlevel 1 ( echo  [HATA] Build basarisiz. & pause & exit /b 1 )
    echo.
    echo  Telefona kuruluyor...
    adb install -r build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo  [OK] Kuruldu!
    pause
    goto :eof
)

echo.
echo  Istediginde:
echo    start-web.bat     Web baslat
echo    make install      APK derle + telefona kur
echo.
pause
