// Popup: fire a capture, show license status, open the upgrade page.
function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

function showErr(text) {
  const el = document.getElementById('err');
  el.textContent = text;
  el.style.display = 'block';
}

let isPaid = false;

async function capture(mode) {
  if (mode === 'fullpage' && !isPaid) {
    showErr('Full-page capture is a Pro feature. Opening upgrade...');
    await send({ type: 'openPayment' });
    return;
  }
  const btns = document.querySelectorAll('button.cap');
  btns.forEach((b) => (b.disabled = true));
  const res = await send({ type: 'capture', mode });
  if (res && res.ok) {
    window.close();
  } else {
    btns.forEach((b) => (b.disabled = false));
    showErr((res && res.error) || 'Capture failed.');
  }
}

document.getElementById('visible').addEventListener('click', () => capture('visible'));
document.getElementById('fullpage').addEventListener('click', () => capture('fullpage'));
document.getElementById('upgrade').addEventListener('click', () => send({ type: 'openPayment' }));

(async () => {
  const res = await send({ type: 'getUser' });
  const status = document.getElementById('status');
  const upgrade = document.getElementById('upgrade');
  if (res && res.ok && res.user && res.user.paid) {
    isPaid = true;
    status.textContent = 'Pro';
    status.className = 'badge pro';
    upgrade.style.display = 'none';
  }
})();
