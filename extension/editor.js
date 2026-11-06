// ReproShot editor: annotate the capture and export a bug report.
// All rendering is local. Annotation coordinates are stored in natural image
// pixels so exports are full resolution regardless of on-screen zoom.

const CAPTURE_KEY = 'reproshot_pending_capture';
const PRO_TOOLS = new Set(['blur']);

const state = {
  img: null,
  env: null,
  mode: 'visible',
  scale: 1,
  tool: 'select',
  color: '#ff2d55',
  shapes: [],
  paid: false,
  drag: null
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1700);
}

function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });
}

function fitScale(naturalW) {
  const avail = Math.max(320, window.innerWidth - 300 - 60);
  return Math.min(1, avail / naturalW);
}

function resizeCanvas() {
  state.scale = fitScale(state.img.naturalWidth);
  canvas.width = state.img.naturalWidth;
  canvas.height = state.img.naturalHeight;
  canvas.style.width = Math.round(state.img.naturalWidth * state.scale) + 'px';
  canvas.style.height = Math.round(state.img.naturalHeight * state.scale) + 'px';
  render();
}

function pixelate(targetCtx, x, y, w, h) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  x = Math.round(x); y = Math.round(y);
  const sample = Math.max(4, Math.round(Math.min(w, h) / 10));
  const tw = Math.max(1, Math.round(w / sample));
  const th = Math.max(1, Math.round(h / sample));
  const tmp = new OffscreenCanvas(tw, th);
  const tctx = tmp.getContext('2d');
  tctx.drawImage(canvasBase, x, y, w, h, 0, 0, tw, th);
  targetCtx.imageSmoothingEnabled = false;
  targetCtx.drawImage(tmp, 0, 0, tw, th, x, y, w, h);
  targetCtx.imageSmoothingEnabled = true;
}

// A stable copy of the untouched capture to sample from for blur regions.
let canvasBase = null;

function drawShape(c, s) {
  c.lineWidth = Math.max(2, Math.round(state.img.naturalWidth / 400));
  c.strokeStyle = s.color;
  c.fillStyle = s.color;
  if (s.type === 'rect') {
    c.strokeRect(s.x, s.y, s.w, s.h);
  } else if (s.type === 'arrow') {
    drawArrow(c, s.x1, s.y1, s.x2, s.y2);
  } else if (s.type === 'text') {
    const fs = Math.max(16, Math.round(state.img.naturalWidth / 45));
    c.font = '700 ' + fs + 'px -apple-system, Segoe UI, Roboto, sans-serif';
    c.textBaseline = 'top';
    const pad = fs * 0.3;
    const w = c.measureText(s.text).width;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.72)';
    c.fillRect(s.x - pad, s.y - pad, w + pad * 2, fs + pad * 2);
    c.fillStyle = s.color;
    c.fillText(s.text, s.x, s.y);
    c.restore();
  } else if (s.type === 'blur') {
    pixelate(c, s.x, s.y, s.w, s.h);
  }
}

function drawArrow(c, x1, y1, x2, y2) {
  const head = Math.max(10, state.img.naturalWidth / 90);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath();
  c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
  c.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
  c.closePath();
  c.fill();
}

function render(preview) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.img, 0, 0);
  for (const s of state.shapes) drawShape(ctx, s);
  if (preview) drawShape(ctx, preview);
}

function evtToNatural(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / state.scale,
    y: (e.clientY - r.top) / state.scale
  };
}

// --- Pointer handling ---
canvas.addEventListener('mousedown', (e) => {
  if (state.tool === 'select') return;
  if (PRO_TOOLS.has(state.tool) && !state.paid) { promptUpgrade(); return; }
  const p = evtToNatural(e);
  if (state.tool === 'text') {
    const text = window.prompt('Label text');
    if (text) { state.shapes.push({ type: 'text', x: p.x, y: p.y, text, color: state.color }); render(); }
    return;
  }
  state.drag = { startX: p.x, startY: p.y, x: p.x, y: p.y };
});

canvas.addEventListener('mousemove', (e) => {
  if (!state.drag) return;
  const p = evtToNatural(e);
  state.drag.x = p.x; state.drag.y = p.y;
  render(previewShape());
});

window.addEventListener('mouseup', () => {
  if (!state.drag) return;
  const s = previewShape();
  const big = (Math.abs(state.drag.x - state.drag.startX) + Math.abs(state.drag.y - state.drag.startY)) > 6;
  if (s && big) state.shapes.push(s);
  state.drag = null;
  render();
});

function previewShape() {
  if (!state.drag) return null;
  const { startX, startY, x, y } = state.drag;
  if (state.tool === 'rect') return { type: 'rect', x: Math.min(startX, x), y: Math.min(startY, y), w: Math.abs(x - startX), h: Math.abs(y - startY), color: state.color };
  if (state.tool === 'blur') return { type: 'blur', x: Math.min(startX, x), y: Math.min(startY, y), w: Math.abs(x - startX), h: Math.abs(y - startY) };
  if (state.tool === 'arrow') return { type: 'arrow', x1: startX, y1: startY, x2: x, y2: y, color: state.color };
  return null;
}

// --- Toolbar ---
document.getElementById('tools').addEventListener('click', (e) => {
  const b = e.target.closest('button.tool');
  if (!b || !b.dataset.tool) return;
  if (PRO_TOOLS.has(b.dataset.tool) && !state.paid) { promptUpgrade(); return; }
  state.tool = b.dataset.tool;
  document.querySelectorAll('.tool').forEach((t) => t.classList.remove('active'));
  b.classList.add('active');
  canvas.style.cursor = state.tool === 'select' ? 'default' : 'crosshair';
});
document.getElementById('color').addEventListener('input', (e) => { state.color = e.target.value; });
document.getElementById('undo').addEventListener('click', () => { state.shapes.pop(); render(); });
document.getElementById('clear').addEventListener('click', () => { state.shapes = []; render(); });

// --- Exports ---
function flatten() {
  const out = new OffscreenCanvas(canvas.width, canvas.height);
  const octx = out.getContext('2d');
  octx.drawImage(state.img, 0, 0);
  // blur shapes sample from the clean base; temporarily point canvasBase at it
  const prevBase = canvasBase;
  canvasBase = state.img;
  const realCtx = ctx; // drawShape uses global ctx for font metrics only
  void realCtx;
  for (const s of state.shapes) {
    if (s.type === 'blur') { pixelate(octx, s.x, s.y, s.w, s.h); }
    else drawShape(octx, s);
  }
  canvasBase = prevBase;
  return out;
}

async function flattenedBlob() {
  const out = flatten();
  return out.convertToBlob({ type: 'image/png' });
}

document.getElementById('dl').addEventListener('click', async () => {
  const blob = await flattenedBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url; a.download = 'reproshot-' + stamp + '.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('PNG downloaded');
});

document.getElementById('copyimg').addEventListener('click', async () => {
  try {
    const blob = await flattenedBlob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast('Image copied to clipboard');
  } catch (e) {
    toast('Copy blocked by the browser; use Download');
  }
});

function envRows() {
  const en = state.env || {};
  return [
    ['URL', en.url], ['Browser', en.browser], ['OS', en.os],
    ['Viewport', en.viewport], ['Screen', en.screen],
    ['Language', en.language], ['Captured', en.capturedAt]
  ].filter((r) => r[1]);
}

function buildMarkdown(forJira) {
  const title = document.getElementById('title').value.trim() || 'Bug report';
  const notes = document.getElementById('notes').value.trim();
  const rows = envRows();
  let md = '';
  if (forJira) {
    md += 'h2. ' + title + '\n\n';
    if (notes) md += notes + '\n\n';
    md += '*Environment*\n||Field||Value||\n';
    for (const [k, v] of rows) md += '|' + k + '|' + v + '|\n';
    md += '\n_Screenshot: paste the copied image here._\n';
  } else {
    md += '## ' + title + '\n\n';
    if (notes) md += notes + '\n\n';
    md += '**Environment**\n\n| Field | Value |\n| --- | --- |\n';
    for (const [k, v] of rows) md += '| ' + k + ' | ' + v + ' |\n';
    md += '\n_Screenshot: paste the copied image here._\n';
  }
  return md;
}

async function copyReport(forJira) {
  if (!state.paid) { promptUpgrade(); return; }
  try {
    await navigator.clipboard.writeText(buildMarkdown(forJira));
    toast(forJira ? 'Jira/Linear report copied' : 'Bug report copied');
  } catch (e) {
    toast('Copy blocked by the browser');
  }
}
document.getElementById('copymd').addEventListener('click', () => copyReport(false));
document.getElementById('copyjira').addEventListener('click', () => copyReport(true));

function promptUpgrade() {
  document.getElementById('upsell').style.display = 'block';
  toast('That is a Pro feature');
}
document.getElementById('upgrade').addEventListener('click', () => send({ type: 'openPayment' }));

function applyLicense() {
  const lic = document.getElementById('license');
  if (state.paid) {
    lic.textContent = 'Pro'; lic.classList.add('pro');
    document.getElementById('upsell').style.display = 'none';
    document.querySelectorAll('.pro-tool, .pro-exp').forEach((el) => {
      el.classList.remove('pro-locked');
      el.textContent = el.textContent.replace(' (Pro)', '');
    });
  } else {
    document.querySelectorAll('.pro-tool, .pro-exp').forEach((el) => el.classList.add('pro-locked'));
  }
}

function renderEnv() {
  const host = document.getElementById('env');
  host.innerHTML = '';
  for (const [k, v] of envRows()) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span class="k"></span><span class="v"></span>';
    row.querySelector('.k').textContent = k;
    row.querySelector('.v').textContent = v;
    host.appendChild(row);
  }
}

async function init() {
  const data = await chrome.storage.local.get(CAPTURE_KEY);
  const cap = data[CAPTURE_KEY];
  if (!cap) { document.getElementById('env').textContent = 'No capture found. Use the toolbar button to capture a page.'; return; }
  state.env = cap.env; state.mode = cap.mode;
  state.img = await loadImage(cap.image);
  canvasBase = state.img;
  resizeCanvas();
  renderEnv();
  const res = await send({ type: 'getUser' });
  state.paid = !!(res && res.ok && res.user && res.user.paid);
  applyLicense();
  await chrome.storage.local.remove(CAPTURE_KEY);
}

window.addEventListener('resize', () => { if (state.img) resizeCanvas(); });
init();
