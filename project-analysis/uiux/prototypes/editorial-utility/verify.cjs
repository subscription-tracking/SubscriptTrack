const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true });
  const page = await browser.newPage({ viewport:{width:390,height:844},deviceScaleFactor:1 });
  const cases = [['dashboard-dark.png','multiple','dark'],['dashboard-light.png','multiple','light'],['dashboard-single.png','single','dark'],['dashboard-empty.png','empty','dark'],['dashboard-overdue.png','overdue','dark'],['dashboard-multiple-currencies.png','currencies','dark']];
  for (const [file,scenario,theme] of cases) {
    await page.goto(`http://127.0.0.1:8765/?scenario=${scenario}&theme=${theme}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:path.join(__dirname,file)});
    const text=await page.locator('main').innerText();
    if(scenario==='multiple' && (!text.includes('₺219,90') || !text.includes('₺229,80') || !text.includes('₺449,70') || text.includes('CloudNest'))) throw Error('Ana senaryo veya 14 günlük sınır hatası');
    if(scenario==='overdue' && !text.includes('25 Ekim')) throw Error('Gecikme görünmüyor');
    if(scenario==='currencies') { await page.getByRole('button',{name:'USD',exact:true}).click(); if(!(await page.locator('main').innerText()).includes('$0,00')) throw Error('Birim seçimi hatası'); }
    console.log(file,'OK');
  }
  for (const scenario of ['empty','single','multiple','complete','overdue','trial','currencies','error','offline']) {
    await page.goto(`http://127.0.0.1:8765/?scenario=${scenario}`);
    if (await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw Error('Yatay taşma: '+scenario);
    if (scenario==='error' || scenario==='offline') if(!(await page.locator('main').innerText()).includes('Ödeme özeti kullanılamıyor')) throw Error('Eksik veri hatası');
  }
  await page.setViewportSize({width:320,height:640}); await page.goto('http://127.0.0.1:8765/?scenario=multiple');
  if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw Error('320px yatay taşma');
  await page.setViewportSize({width:480,height:900}); await page.reload();
  if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw Error('480px yatay taşma');
  console.log('9 senaryo, 320/480px ve para birimi kontrolü OK');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
