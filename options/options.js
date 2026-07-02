const GITHUB_API = 'https://api.github.com/graphql';
const $ = (id) => document.getElementById(id);

async function testToken(token) {
  const res = await fetch(GITHUB_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query { viewer { login } }`,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    if (res.status === 401) return { ok: false, msg: 'Token is invalid or expired.' };
    if (res.status === 403) return { ok: false, msg: 'Rate limited. Try again later.' };
    return { ok: false, msg: `HTTP ${res.status}` };
  }

  if (body.errors) {
    return { ok: false, msg: body.errors[0].message };
  }

  return { ok: true, login: body.data.viewer.login };
}

async function saveToken() {
  const token = $('token-input').value.trim();
  const theme = $('theme-select').value;

  if (!token) {
    showMessage('Please enter a token.', 'error');
    return;
  }

  $('save-btn').disabled = true;
  $('save-btn').textContent = 'Saving...';

  const result = await testToken(token);

  if (result.ok) {
    await chrome.storage.sync.set({ token, theme });
    showMessage(`Token saved! Authenticated as ${result.login}.`, 'success');
  } else {
    showMessage(`Token test failed: ${result.msg}`, 'error');
  }

  $('save-btn').disabled = false;
  $('save-btn').textContent = 'Save';
}

async function testTokenOnly() {
  const token = $('token-input').value.trim();

  if (!token) {
    showMessage('Enter a token first.', 'error');
    return;
  }

  $('test-btn').disabled = true;
  $('test-btn').textContent = 'Testing...';

  const result = await testToken(token);

  if (result.ok) {
    showMessage(`Token works! Authenticated as ${result.login}.`, 'success');
  } else {
    showMessage(`Token test failed: ${result.msg}`, 'error');
  }

  $('test-btn').disabled = false;
  $('test-btn').textContent = 'Test Token';
}

function showMessage(text, type) {
  const msg = $('message');
  msg.textContent = text;
  msg.className = `message ${type}`;
  msg.classList.remove('hidden');
}

async function loadSettings() {
  const { token, theme } = await chrome.storage.sync.get(['token', 'theme']);
  if (token) $('token-input').value = token;
  if (theme) $('theme-select').value = theme;
}

document.addEventListener('DOMContentLoaded', loadSettings);
$('save-btn').addEventListener('click', saveToken);
$('test-btn').addEventListener('click', testTokenOnly);
