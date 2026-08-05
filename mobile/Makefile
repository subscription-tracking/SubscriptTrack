FLUTTER := flutter
ENV_FILE := .env

.PHONY: setup web android install clean help

## İlk kurulum: bağımlılıkları indir, .env varlığını kontrol et
setup:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo ""; \
		echo "⚠️  .env dosyası bulunamadı!"; \
		echo "   cp .env.example .env  yapıp Supabase key'lerini gir."; \
		echo ""; \
		exit 1; \
	fi
	$(FLUTTER) pub get

## Web sunucusunu Supabase bağlantılı başlat (tarayıcıda açılır)
web:
	$(FLUTTER) run -d chrome --dart-define-from-file=$(ENV_FILE)

## Web sunucusunu headless başlat (Claude Code preview için)
web-server:
	$(FLUTTER) run -d web-server --web-port 8080 --dart-define-from-file=$(ENV_FILE)

## Release APK derle
android:
	$(FLUTTER) build apk --release --dart-define-from-file=$(ENV_FILE)

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
	@echo "  make setup    Bağımlılıkları indir (.env kontrolü dahil)"
	@echo "  make web      Tarayıcıda aç (Supabase bağlantılı)"
	@echo "  make android  Release APK derle"
	@echo "  make install  APK derle ve telefona kur (USB gerekli)"
	@echo "  make clean    Build çıktılarını temizle"
	@echo ""
