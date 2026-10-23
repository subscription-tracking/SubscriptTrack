# Expo Go uzak önizleme

## Kullanıcı tercihi - 22 Ekim 2026

- Paylaşım Expo Go üzerinden yapılacak; APK paylaşımı bu isteğin alternatifi değildir.
- Test kullanıcısı bilgisayarla farklı ağda olacak; yalnız LAN/USB erişimi yeterli değildir.
- Paylaşılacak adres sabit kalmalı; her açılışta yeni QR veya bağlantı gönderilmemeli.
- Erişim sürekli kullanılabilir olmalı; yalnız mevcut terminal oturumuna bağımlı geçici bağlantı tam kabul sayılmaz.
- Projeyi Expo/EAS hesabına bağlamadan çözüm tercih ediliyor. Başka bir hizmet hesabı veya alan adı gerektiğinde bu bağımlılık ayrıca açıklanmalı.
- Adres veya paylaşım yöntemi kullanıcıya haber verilmeden değiştirilmeyecek.

## Mevcut sonuç

**22 Ekim yerel bildirim güncellemesi:** Android/iOS Go için yerel API adaptörü açıldı; Android fiziksel Go'da izin ve arka planda test teslimi doğrulandı. Bu yeni kod yerel Metro 8083 oturumunda çalışıyor. Mevcut dış 8082 CI paketi kontrolünde adaptör bulunmadı; adresi korumak için sunucu yeniden başlatılmadı. Dış pakete aktarım açıktır. [Kanıt ve kalan kabul](../quality/expo-go-notifications-2026-10-22.md).

**Hesaba bağlı tünel - son doğrulama:** SDK 57'de EXPO_UNSTABLE_TUNNEL_V2=1 ile Expo Go tüneli açıldı. @expo/ws-tunnel ws ^8 peer bağımlılığı isterken kökte ws 7 çözülmesi WebSocket constructor hatasına neden oluyordu; ws ^8.19.0 geliştirme bağımlılığı eklendi (kurulu ve lock 8.22.0). İlk kurulumun lock yazımı hatası package-lock-only adımıyla giderildi. Typecheck/lint geçti. npm, mevcut worklets peer uyarısını ve kalan audit bulgularını bildirdi; tüm dependency riskleri kapanmış değildir.

Çalışan oturum URL'si: `exp://c-mfurkant-uk20wf-mvjusn9fkxoe3u6s.on.expo.app`. Dış HTTPS manifesti 200, Android JS/Hermes paketi 200 (9.731.410 bayt). Samsung telefonda Wi-Fi kapalı/mobil veri açıkken Expo Go giriş ekranına ulaştı. Bu kontrol Expo Go'daki bütün native özelliklerin kabulü değildir. Mevcut sunucu açık bırakılmıştır; Windows servisi, otomatik başlatma veya harici sürekli hosting kurulmamıştır. Bilgisayar/ağ/süreç kapanırsa erişim kesilir; tünel yeniden başlatılırsa adres değişebilir. Kalıcı 7/24 ve değişmeyen adres şartı tamamlanmış değildir.

Yeniden başlatma: expo kökünde `node scripts/start-remote-preview.cjs`. Aynı anda ikinci sunucuyu başlatmayın; mevcut oturum adresini değiştirmeden önce kullanıcıya haber verin. CI modu canlı kod izlemeyi kapatır; bu paylaşılan oturum değişikliklerin otomatik yayınlandığı üretim dağıtımı değildir.

**22 Ekim hesap kararı:** Kullanıcı, hesapsız paylaşım başarısızlıklarından sonra mevcut “mfurkan” hesabına bağlanmasını istedi. CLI oturumu `mfurkant` olarak doğrulandı. `@mfurkant/subscripttrack` EAS projesi oluşturuldu/bağlandı; proje kimliği `c03f1989-6da2-482d-9b84-1e681531528c`. `expo/app.json` içinde owner ve extra.eas.projectId kaydedildi. Bu karar önceki hesapsız çözüm tercihini geçersiz kılar; Expo Go, farklı ağ ve sabit bağlantı tercihleri sürer. Proje sayfası https://expo.dev/accounts/mfurkant/projects/subscripttrack adresidir; bu sayfa çalışan Expo Go önizleme URL'si değildir. EAS Update yayınlanmadı; mağaza yayını yapılmadı. Dış önizleme kabulü hâlâ açıktır.

Kurulu SDK 57 CLI ile Expo Go modu, port 8082 ve sabit EXPO_TUNNEL_SUBDOMAIN=subscripttrack-expo-7f43a9 kullanılarak ngrok tüneli denenmiştir. CLI `failed to start tunnel / remote gone away` hatasıyla kapanmıştır. Başarılı dış erişim URL'si üretilmemiştir. Rastgele URL'ye geçiş yapılmamıştır. Bu tur sürekli erişim kurulmuş değildir.

Makinede cloudflared bulunmasına rağmen kullanıcı profilinde adlandırılmış tünel yapılandırması bulunamadı. Expo CLI sabit alt alan adını deneysel olarak destekler; bu, adres tahsisi veya kesintisiz hizmet garantisi değildir. Bilgisayar, ağ ve sunucu kapanınca yerel Metro üzerinden erişim kesilir. Kalıcı hizmet için sabit adresin tahsisi, sürekli çalışan sunucu ve yeniden başlatma/sağlık kontrolü birlikte gerekir.

## Kabul

### Sonraki deneme - 22 Ekim

Kullanıcı daha önce hesapsız erişim kullanıldığını belirtti. Varsayılan Expo Go/ngrok tüneli de `remote gone away` ile başarısız oldu. Hesapsız Cloudflare Quick Tunnel bağlantısı kuruldu; ancak Expo'yu EXPO_PACKAGER_PROXY_URL ile bu dış adrese yönlendirerek başlatma komutu otomatik onay denetimince çalıştırılmadan engellendi (`blocked by policy`, ayrıntılı gerekçe yok). Engeli başka komut/araç üzerinden aşma denenmedi. Kullanılmayan Quick Tunnel kapatıldı; başarılı Expo Go dış erişimi yok. Quick Tunnel adresi yeniden oluşturulduğunda değiştiği için kullanıcının kalıcı adres şartını zaten karşılamaz.

Kaynak: [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

1. Sabit adres tahsis edilmiş olmalı; yeniden başlatmada değişmemeli.
2. Farklı ağdaki Expo Go'da manifest, Android JavaScript paketi ve uygulama açılışı doğrulanmalı.
3. Expo Go SDK uyumu ve mevcut bildirim/native modül sınırları açıkça gösterilmeli.
4. Sunucu yeniden başlatma sonrası aynı adres ve açılış yeniden doğrulanmalı.
5. Kullanıcıya gerçek erişim süresi ve bilgisayar/hosting bağımlılığı bildirilmeli; doğrulanmadan 7/24 iddiası kullanılmamalı.

Referans: [Expo CLI tunneling](https://docs.expo.dev/more/expo-cli/#tunneling).
