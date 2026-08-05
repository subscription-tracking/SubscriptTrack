#!/usr/bin/env bash
set -e

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
DIM="\033[2m"

echo ""
echo -e "${BOLD}SubscriptTrack — Kurulum${RESET}"
echo "──────────────────────────────────"
echo ""

# 1. Flutter kontrolü
if ! command -v flutter &> /dev/null; then
  echo -e "${RED}✗ Flutter bulunamadı.${RESET}"
  echo ""
  echo "  Kur: https://flutter.dev/get-started"
  echo ""
  exit 1
fi

FLUTTER_VERSION=$(flutter --version 2>/dev/null | head -1)
echo -e "${GREEN}✓ Flutter${RESET} ${DIM}${FLUTTER_VERSION}${RESET}"

# 2. mobile/ dizinine geç
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/mobile"

# 3. .env kontrolü (isteğe bağlı; yoksa yerel mod)
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠  .env dosyası oluşturuldu → mobile/.env${RESET}"
    echo "  Boş bırakırsan uygulama yerel modda çalışır."
  else
    echo -e "${RED}✗ .env.example bulunamadı.${RESET}"
    exit 1
  fi
fi

# .env dolu mu?
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d'=' -f2- | tr -d '[:space:]')
if [ -z "$SUPABASE_URL" ] || echo "$SUPABASE_URL" | grep -qE "xxxx|your-project"; then
  echo ""
  echo -e "${YELLOW}⚠  mobile/.env dosyası dolu değil.${RESET}"
  echo ""
  echo "  Supabase için SUPABASE_URL ve SUPABASE_ANON_KEY alanlarını doldur."
  echo "  Yerel modda devam ediliyor."
  echo ""
fi

if [ -n "$SUPABASE_URL" ] && ! echo "$SUPABASE_URL" | grep -qE "xxxx|your-project"; then
  echo -e "${GREEN}✓ .env${RESET} Supabase anahtarları mevcut"
fi

# 4. Bağımlılıkları indir
echo ""
echo -e "${CYAN}→ Bağımlılıklar indiriliyor...${RESET}"
echo ""
flutter pub get

# 5. Başarı + ne yapmak istiyorsun?
echo ""
echo "──────────────────────────────────"
echo -e "${GREEN}${BOLD}✓ Kurulum tamamlandı!${RESET}"
echo ""
echo "  Şimdi ne yapmak istersin?"
echo ""
echo -e "  ${BOLD}1)${RESET} Web — Tarayıcıda aç (Chrome)"
echo -e "  ${BOLD}2)${RESET} Android — APK derle + telefona kur (USB bağlı olmalı)"
echo -e "  ${BOLD}3)${RESET} Çıkış"
echo ""
read -r -p "  Seçim [1/2/3]: " CHOICE

case "$CHOICE" in
  1)
    echo ""
    echo -e "${CYAN}→ Web başlatılıyor...${RESET}"
    echo ""
    if [ -n "$SUPABASE_URL" ] && ! echo "$SUPABASE_URL" | grep -qE "xxxx|your-project"; then
      flutter run -d chrome --dart-define-from-file=.env
    else
      flutter run -d chrome
    fi
    ;;
  2)
    echo ""
    echo -e "${CYAN}→ APK derleniyor...${RESET}"
    echo ""
    if [ -n "$SUPABASE_URL" ] && ! echo "$SUPABASE_URL" | grep -qE "xxxx|your-project"; then
      flutter build apk --release --dart-define-from-file=.env
    else
      flutter build apk --release
    fi
    echo ""
    echo -e "${CYAN}→ Telefona kuruluyor...${RESET}"
    adb install -r build/app/outputs/flutter-apk/app-release.apk
    echo ""
    echo -e "${GREEN}✓ Kuruldu!${RESET}"
    ;;
  *)
    echo ""
    echo "  İstediğinde:"
    echo -e "  ${BOLD}./start-web.sh${RESET}   Web başlat"
    echo -e "  ${BOLD}make install${RESET}      APK derle + telefona kur"
    echo ""
    ;;
esac
