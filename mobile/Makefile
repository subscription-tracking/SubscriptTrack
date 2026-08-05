FLUTTER := flutter
ENV_FILE := .env
ENV_ARGS := $(shell if [ -f $(ENV_FILE) ] && grep -qE '^SUPABASE_URL=https?://[^[:space:]]+' $(ENV_FILE) && ! grep -qE 'xxxx|your-project' $(ENV_FILE); then echo --dart-define-from-file=$(ENV_FILE); fi)

.PHONY: setup web android install clean help

## İlk kurulum: bağımlılıkları indir (.env isteğe bağlıdır)
setup:
	$(FLUTTER) pub get

## Web sunucusunu Supabase bağlantılı başlat (tarayıcıda açılır)
web:
	$(FLUTTER) run -d chrome $(ENV_ARGS)

## Web sunucusunu headless başlat (Claude Code preview için)
web-server:
	$(FLUTTER) run -d web-server --web-port 8080 $(ENV_ARGS)

## Release APK derle
android:
	$(FLUTTER) build apk --release $(ENV_ARGS)

## Release APK derle ve bağlı telefona kur (USB bağlı olmalı)
install: android
	adb install -r build/app/outputs/flutter-apk/app-release.apk

## Build çıktılarını temizle
clean:
	$(FLUTTER) clean

help:
	@echo ""
	@echo "SubscriptTrack — Komutlar"
	@echo ""
	@echo "  make setup    Bağımlılıkları indir"
	@echo "  make web      Tarayıcıda aç (varsa Supabase bağlantılı)"
	@echo "  make android  Release APK derle"
	@echo "  make install  APK derle ve telefona kur (USB gerekli)"
	@echo "  make clean    Build çıktılarını temizle"
	@echo ""
