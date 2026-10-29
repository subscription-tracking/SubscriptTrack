// Sentetik örnekler; para değerleri minor unit. Hiçbir servis veya kalıcı veri kullanılmaz.
const today = '2026-10-28';
const nova = { name: 'NovaPlay', date: '2026-10-30', amount: 21990, currency: 'TRY', kind: 'renewal' };
const sound = { name: 'Soundline', date: '2026-11-03', amount: 7990, currency: 'TRY', kind: 'renewal' };
const cloud = { name: 'CloudNest', date: '2026-11-12', amount: 14990, currency: 'TRY', kind: 'renewal' };
const fixtures = {
  multiple: { records: [nova,sound,cloud], summaries: { TRY: { paid:22980, remaining:21990 } } },
  empty: { records: [], summaries: {} },
  single: { records: [nova], summaries: { TRY: { paid:0, remaining:21990 } } },
  complete: { records: [sound,cloud], summaries: { TRY: { paid:22980, remaining:0 } } },
  overdue: { records: [{ ...nova,date:'2026-10-25' },sound,cloud], summaries: { TRY: { paid:22980, remaining:21990 } }, attention:'overdue' },
  trial: { records: [{ name:'StudioBox', date:'2026-10-31', amount:9990, currency:'TRY', kind:'trial' },sound], summaries: { TRY: { paid:0,remaining:0 } }, attention:'trial' },
  currencies: { records: [nova,{ ...sound,amount:599,currency:'USD' },{ ...cloud,amount:899,currency:'EUR' }], summaries: { TRY:{paid:0,remaining:21990}, USD:{paid:0,remaining:0}, EUR:{paid:0,remaining:0} } },
  error: { records:[nova,sound,cloud], summaries:null },
  offline: { records:[nova,sound,cloud], summaries:null, offline:true },
};
const $ = (id) => document.getElementById(id);
let scenario = new URLSearchParams(location.search).get('scenario') || 'multiple';
if (!fixtures[scenario]) scenario = 'multiple';
let theme = new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark';
let currency = 'TRY';
const dayDiff = (date) => Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
const money = (minor, code) => new Intl.NumberFormat('tr-TR',{ style:'currency',currency:code }).format(minor/100);
const dateParts = (date) => { const d=new Date(date+'T00:00:00Z'); return [String(d.getUTCDate()).padStart(2,'0'),new Intl.DateTimeFormat('tr-TR',{month:'short',timeZone:'UTC'}).format(d).replace('.','')]; };
function show(title, copy) { $('dialog-title').textContent=title; $('dialog-copy').textContent=copy; $('dialog').showModal(); }
function render() {
  document.documentElement.dataset.theme=theme;
  $('theme').textContent=theme==='dark'?'☼':'☾';
  $('theme').setAttribute('aria-label',theme==='dark'?'Açık temaya geç':'Koyu temaya geç');
  $('scenario').value=scenario;
  const f=fixtures[scenario];
  const entries=f.records.filter(r=>dayDiff(r.date)>=0 && dayDiff(r.date)<14).sort((a,b)=>a.date.localeCompare(b.date));
  const summary=f.summaries?.[currency];
  const tabs=f.summaries && Object.keys(f.summaries).length>1 ? `<div class="currency-list" aria-label="Para birimi">${Object.keys(f.summaries).map(c=>`<button type="button" data-currency="${c}" aria-pressed="${c===currency}">${c}</button>`).join('')}</div>`:'';
  let hero = summary ? `<h1>Bu ay kalan ödemeler</h1><div class="balance">${money(summary.remaining,currency)}</div><div class="hero-foot"><div>Ödenen<strong>${money(summary.paid,currency)}</strong></div><div class="divider"></div><div>Bu ay toplam<strong>${money(summary.paid+summary.remaining,currency)}</strong></div></div>${summary.remaining===0&&summary.paid>0?'<p class="hero-note hero-status">✓ Bu ayın ödemeleri tamamlandı</p>':''}${tabs}` : `<div class="unavailable"><strong>Ödeme özeti kullanılamıyor</strong>Ödeme geçmişi yüklenemedi. Tutarlar şu anda gösterilemiyor.</div>`;
  const rows=entries.map(r=>{ const [day,month]=dateParts(r.date); return `<div class="event"><div class="date-block"><strong>${day}</strong><span>${month}</span></div><div><div class="event-name">${r.name}</div><div class="event-sub">${r.kind==='trial'?'Deneme bitiyor':'Yenileme'}</div></div><div class="event-price">${money(r.amount,r.currency)}<span>${r.kind==='trial'?'Sonraki ücret':'Ödeme tutarı'}</span></div></div>`; }).join('');
  const decision=f.attention==='overdue'?`<section class="decision"><div class="label">Dikkat gerektiriyor</div><p>NovaPlay ödemesi 25 Ekim'de bekleniyordu.</p><button type="button" data-action="overdue">Ödemeyi incele →</button></section>`:f.attention==='trial'?`<section class="decision"><div class="label">Deneme bitiyor</div><p>StudioBox denemesi 31 Ekim'de sona eriyor.</p><button type="button" data-action="trial">Denemeyi incele →</button></section>`:'';
  const offline=f.offline?'<div class="offline" role="status"><strong>Çevrimdışısın.</strong> Kayıtlı abonelikler gösteriliyor; ödeme özeti kullanılamıyor.</div>':'';
  $('content').innerHTML=offline+`<div class="hero-top"><span class="eyebrow">Ödeme özeti</span><span class="month">Ekim 2026</span></div>`+(scenario==='empty'?`<section class="empty"><div class="empty-icon" aria-hidden="true">◌</div><h2>Aboneliklerin, tek bir yerde.</h2><p>İlk aboneliğini ekleyerek ödemelerini ve yenileme tarihlerini takip etmeye başla.</p><button class="primary" data-action="add"><span class="plus">+</span>İlk aboneliğini ekle</button></section>`:`<section aria-label="Bu ayın ödeme özeti">${hero}</section>${decision}<hr class="rule"><section><div class="section-head"><div><h2>Yaklaşanlar</h2><p>Önümüzdeki 14 gün</p></div><button class="text-btn" data-action="calendar">Takvim →</button></div>${rows || '<p class="hero-note">Önümüzdeki 14 günde ödeme yok.</p>'}</section><div class="add-row"><div><strong>${f.records.length} abonelik</strong><p>Tüm kayıtlarını tek yerden yönet.</p></div><button class="primary" data-action="add"><span class="plus">+</span>Abonelik ekle</button></div>`);
  document.querySelectorAll('[data-currency]').forEach(b=>b.addEventListener('click',()=>{currency=b.dataset.currency;render()}));
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>show(({add:'Abonelik ekle',calendar:'Takvim',overdue:'Ödemeyi incele',trial:'Denemeyi incele'})[b.dataset.action],'Bu bağımsız görsel prototipte bu ekran açılmaz ve hiçbir veri değiştirilmez.')));
}
$('scenario').addEventListener('change',e=>{scenario=e.target.value;currency='TRY';render()});
$('theme').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';render()});
$('close-dialog').addEventListener('click',()=>$('dialog').close());
$('notifications').addEventListener('click',()=>show('Bildirimler','Bu prototip yalnızca ana sayfayı gösterir.'));
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.nav!=='Ana Sayfa')show(b.dataset.nav,'Bu prototip yalnızca ana sayfayı gösterir.')}));
render();
