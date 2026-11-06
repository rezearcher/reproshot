// ReproShot background service worker.
// Owns: ExtPay billing bridge, visible-tab capture, full-page scroll-stitch,
// environment metadata collection, and handing the result to the editor tab.
// Nothing here ever makes a network request with page content. Captures stay
// in chrome.storage.local on the user's machine.

importScripts('ExtPay.js');

// The slug below is the ExtensionPay product id. It is registered once on
// extensionpay.com (see store/SETUP.md). Billing degrades to "free tier only"
// until it is registered, so the extension is fully usable before then.
const EXTPAY_ID = 'reproshot';
const extpay = ExtPay(EXTPAY_ID);
extpay.startBackground();

const CAPTURE_KEY = 'reproshot_pending_capture';
// captureVisibleTab is rate limited to 2 calls/sec. Stay well under it.
const CAPTURE_GAP_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id) throw new Error('No active tab to capture.');
  if (/^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url || '')) {
    throw new Error('Browser system pages cannot be captured. Open a normal web page.');
  }
  return tab;
}

// Collect reproducible-environment facts from the page. Runs only on the active
// tab, only after the user clicks capture (activeTab grant). No broad host perms.
function collectEnvInPage() {
  function parseBrowser(ua) {
    const m = {
      Edge: /Edg\/([\d.]+)/,
      Opera: /OPR\/([\d.]+)/,
      Chrome: /Chrome\/([\d.]+)/,
      Firefox: /Firefox\/([\d.]+)/,
      Safari: /Version\/([\d.]+).*Safari/
    };
    for (const [name, re] of Object.entries(m)) {
      const r = ua.match(re);
      if (r) return name + ' ' + r[1].split('.').slice(0, 2).join('.');
    }
    return 'Unknown';
  }
  function parseOS(ua) {
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Mac OS X ([\d_]+)/.test(ua)) return 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g, '.'));
    if (/Android ([\d.]+)/.test(ua)) return 'Android ' + ua.match(/Android ([\d.]+)/)[1];
    if (/(iPhone|iPad); CPU.*OS ([\d_]+)/.test(ua)) return 'iOS ' + ua.match(/OS ([\d_]+)/)[1].replace(/_/g, '.');
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }
  const ua = navigator.userAgent;
  return {
    url: location.href,
    title: document.title,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    viewport: window.innerWidth + ' x ' + window.innerHeight,
    screen: (screen.width + ' x ' + screen.height) + ' @' + (window.devicePixelRatio || 1) + 'x',
    language: navigator.language,
    capturedAt: new Date().toISOString(),
    userAgent: ua
  };
}

async function collectEnv(tabId) {
  const res = await chrome.scripting.executeScript({
    target: { tabId },
    func: collectEnvInPage
  });
  return res && res[0] ? res[0].result : null;
}

// --- Metrics + scroll helpers injected into the page for full-page stitch ---
function pageMetrics() {
  const b = document.body;
  const e = document.documentElement;
  return {
    scrollHeight: Math.max(b.scrollHeight, e.scrollHeight, b.offsetHeight, e.offsetHeight, e.clientHeight),
    clientHeight: window.innerHeight,
    clientWidth: window.innerWidth,
    dpr: window.devicePixelRatio || 1,
    originalScrollY: window.scrollY
  };
}
function scrollToY(y) {
  window.scrollTo(0, y);
  // Neutralize fixed/sticky headers after first segment so they are not
  // stamped repeatedly down the stitched image.
  if (y > 0 && !window.__reproShotHid) {
    window.__reproShotHid = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cs = getComputedStyle(el);
      if ((cs.position === 'fixed' || cs.position === 'sticky') && el.offsetHeight < window.innerHeight) {
        window.__reproShotHid.push([el, el.style.visibility]);
        el.style.visibility = 'hidden';
      }
    }
  }
  return window.scrollY;
}
function restoreScroll(y) {
  if (window.__reproShotHid) {
    for (const [el, v] of window.__reproShotHid) el.style.visibility = v;
    delete window.__reproShotHid;
  }
  window.scrollTo(0, y);
}

async function runInPage(tabId, func, args) {
  const res = await chrome.scripting.executeScript({ target: { tabId }, func, args: args || [] });
  return res && res[0] ? res[0].result : null;
}

async function captureVisible(windowId) {
  return chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
}

async function dataUrlToBitmap(dataUrl) {
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  return createImageBitmap(blob);
}

async function captureVisibleOnly(tab) {
  const env = await collectEnv(tab.id);
  const dataUrl = await captureVisible(tab.windowId);
  return { image: dataUrl, env, mode: 'visible' };
}

async function captureFullPage(tab) {
  const env = await collectEnv(tab.id);
  const m = await runInPage(tab.id, pageMetrics);
  if (!m) throw new Error('Could not measure the page.');
  const totalH = m.scrollHeight;
  const stepH = m.clientHeight;
  const canvas = new OffscreenCanvas(m.clientWidth * m.dpr, totalH * m.dpr);
  const ctx = canvas.getContext('2d');
  let y = 0;
  let guard = 0;
  while (y < totalH && guard < 60) {
    guard++;
    const landedY = await runInPage(tab.id, scrollToY, [y]);
    await sleep(CAPTURE_GAP_MS);
    const shot = await captureVisible(tab.windowId);
    const bmp = await dataUrlToBitmap(shot);
    ctx.drawImage(bmp, 0, landedY * m.dpr);
    bmp.close();
    if (landedY + stepH >= totalH) break;
    y = landedY + stepH;
  }
  await runInPage(tab.id, restoreScroll, [m.originalScrollY]);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const dataUrl = await blobToDataUrl(blob);
  return { image: dataUrl, env, mode: 'fullpage' };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function openEditorWith(result) {
  await chrome.storage.local.set({ [CAPTURE_KEY]: result });
  await chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'capture') {
        const tab = await getActiveTab();
        const result = msg.mode === 'fullpage'
          ? await captureFullPage(tab)
          : await captureVisibleOnly(tab);
        await openEditorWith(result);
        sendResponse({ ok: true });
      } else if (msg.type === 'getUser') {
        const user = await extpay.getUser();
        sendResponse({ ok: true, user: { paid: !!user.paid, plan: user.plan || null } });
      } else if (msg.type === 'openPayment') {
        await extpay.openPaymentPage();
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: 'unknown message' });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e && e.message ? e.message : e) });
    }
  })();
  return true; // async
});
