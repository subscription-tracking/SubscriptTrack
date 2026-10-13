/**
 * Yasal metinler. İçerik Flutter sürümündeki (`mobile/lib/features/settings/presentation/screens`)
 * metinle aynıdır ve taslaktır: dış hukuki inceleme ve onay yerine geçmez.
 * Yayın öncesi metin sahibi tarafından onaylanmalı ve bu dosya güncellenmelidir.
 */

export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  version: string;
  lastUpdated: string;
  summary: string[];
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Gizlilik politikası',
  version: '1.0',
  lastUpdated: '20 Eylül 2026',
  summary: [
    'Yalnızca abonelik takibi için gerekli verileri saklarız.',
    'Verilerini reklam veya pazarlama amacıyla satmayız.',
    'Verilerini dışa aktarabilir veya hesabını kalıcı olarak silebilirsin.',
  ],
  sections: [
    {
      title: 'Hangi verileri topluyoruz',
      body: 'Hesabını oluşturduğunda e-posta adresini; uygulamayı kullanırken eklediğin abonelik kayıtlarını (servis adı, tutar, para birimi, yenileme sıklığı, kategori, notlar), ödeme yöntemi adlarını (gerçek kart bilgisi değil, yalnızca senin verdiğin bir isim) ve hatırlatma tercihlerini saklarız.',
    },
    {
      title: 'Verilerini nerede saklıyoruz',
      body: 'Verilerin Supabase altyapısında güvenli biçimde saklanır. Abonelik kayıtların hesabına bağlıdır. Diğer kullanıcılar bu kayıtlara erişemez.',
    },
    {
      title: 'Verilerini nasıl paylaşıyoruz',
      body: 'Abonelik verilerini reklam, analiz veya pazarlama amacıyla üçüncü taraflarla paylaşmayız veya satmayız. Veriler yalnızca uygulamanın çalışması için altyapı sağlayıcımız Supabase tarafından işlenir.',
    },
    {
      title: 'Bildirimler',
      body: 'Yenileme hatırlatmaları cihazında zamanlanır; bildirim içeriği cihazından dışarı gönderilmez.',
    },
    {
      title: 'Hakların (KVKK)',
      body: '6698 sayılı KVKK kapsamında verilerine erişme, düzeltme ve silme hakkına sahipsin. Verilerini istediğin an Ayarlar → Gizlilik ve veri merkezi → "Verilerimi dışa aktar" ile indirebilir, "Hesabımı ve verilerimi sil" ile hesabınla birlikte kalıcı olarak silebilirsin.',
    },
    {
      title: 'İletişim',
      body: 'Gizlilikle ilgili sorular için uygulama içindeki "Geri bildirim gönder" ekranını kullanabilirsin.',
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Kullanım şartları',
  version: '1.0',
  lastUpdated: '20 Eylül 2026',
  summary: [
    'Uygulama aboneliklerini takip eder; ödeme veya iptal işlemi yapmaz.',
    'Girdiğin abonelik bilgilerinin doğruluğu sana aittir.',
    'Hesabını ve verilerini Ayarlar içinden kalıcı olarak silebilirsin.',
  ],
  sections: [
    {
      title: 'Hizmetin kapsamı',
      body: 'SubscriptTrack, aboneliklerini takip etmene, yenileme tarihlerini görmene ve harcamalarını analiz etmene yardımcı olan bir kişisel finans takip aracıdır. Uygulama üzerinden gerçek bir ödeme veya abonelik satın alma/iptal işlemi yapılmaz — yalnızca senin girdiğin bilgileri kaydeder ve hatırlatır.',
    },
    {
      title: 'Hesabın',
      body: 'Hesabını oluştururken doğru bir e-posta adresi kullanmalısın. Hesabının ve şifrenin güvenliğinden sen sorumlusun.',
    },
    {
      title: 'Girdiğin veriler',
      body: 'Uygulamaya girdiğin abonelik bilgilerinin (tutar, tarih, servis adı vb.) doğruluğundan sen sorumlusun. Uygulama bu bilgilere dayanarak hesaplama ve hatırlatma yapar; üçüncü taraf servis sağlayıcılarının (Netflix, Spotify vb.) gerçek fatura bilgisiyle otomatik senkronize olmaz.',
    },
    {
      title: 'Sorumluluk sınırı',
      body: 'Hatırlatma bildirimleri cihaz ayarlarına, izinlere ve işletim sistemi davranışına bağlıdır; bir bildirimin gecikmesi veya iletilmemesi durumunda oluşabilecek maddi kayıplardan uygulama sorumlu tutulamaz. Uygulama "olduğu gibi" sunulur.',
    },
    {
      title: 'Hesap silme',
      body: 'Ayarlar → Gizlilik ve veri merkezi → "Hesabımı ve verilerimi sil" üzerinden hesabını ve tüm verilerini kalıcı olarak silebilirsin. Bu işlem geri alınamaz.',
    },
    {
      title: 'Değişiklikler',
      body: 'Bu şartlar zaman zaman güncellenebilir; önemli değişiklikler uygulama içinde bildirilir.',
    },
  ],
};
