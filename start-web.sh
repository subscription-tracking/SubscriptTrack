#!/usr/bin/env bash
set -e

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/mobile"

if ! command -v flutter &> /dev/null; then
  echo -e "${RED}✗ Flutter bulunamadı.${RESET} Kurulum: https://docs.flutter.dev/get-started/install"
  exit 1
fi

echo ""
echo -e "${BOLD}SubscriptTrack — Web${RESET}"
echo "──────────────────────────────────"
echo ""

if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠  .env bulunamadı; uygulama yerel modda başlayacak.${RESET}"
  echo "   Supabase bağlantısı için: cp .env.example .env"
  echo ""
  flutter run -d chrome
  exit 0
fi

SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d'=' -f2- | tr -d '[:space:]')
if [ -z "$SUPABASE_URL" ] || echo "$SUPABASE_URL" | grep -qE "xxxx|your-project"; then
  echo -e "${YELLOW}⚠  Supabase anahtarları eksik — uygulama yerel modda başlayacak.${RESET}"
  echo "   Bağlamak için: mobile/.env dosyasını doldur"
  echo ""
  flutter run -d chrome
  exit 0
fi

echo -e "${CYAN}→ Tarayıcıda açılıyor...${RESET}"
echo ""
flutter run -d chrome --dart-define-from-file=.env
