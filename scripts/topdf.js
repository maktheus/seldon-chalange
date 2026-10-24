const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const src = 'file:///home/user/seldon-chalange/docs/desafio-tecnico.html';
  await page.goto(src, { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForFunction(() => document.fonts.status === 'loaded', { timeout: 15000 }); }
  catch (e) { console.log('aviso: fontes nao confirmadas, seguindo com fallback'); }
  await page.waitForTimeout(1200);
  await page.pdf({
    path: '/home/user/seldon-chalange/docs/desafio-tecnico.pdf',
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-family:monospace;font-size:7pt;color:#8b96a3;padding:0 18mm;display:flex;justify-content:space-between;"><span>Seldon Fleet — Especificação Técnica</span><span class="pageNumber"></span></div>',
    margin: { top: '18mm', bottom: '16mm', left: '0mm', right: '0mm' }
  });
  await browser.close();
  console.log('ok');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
