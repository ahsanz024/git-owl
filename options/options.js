const GITHUB_API = 'https://api.github.com/graphql';
const $ = (id) => document.getElementById(id);

function updateDemoControlsVisibility(enabled) {
  $('demo-controls').hidden = !enabled;
}

function isoHoursAgo(hoursAgo) {
  return new Date(Date.now() - (hoursAgo * 60 * 60 * 1000)).toISOString();
}

function buildDemoData() {
  return {
    reviewRequests: {
      issueCount: 5,
      nodes: [
        {
          title: 'Improve onboarding checklist with smart defaults',
          url: 'https://github.com/octo-org/retail-web/pull/1842',
          repository: { nameWithOwner: 'octo-org/retail-web' },
          createdAt: isoHoursAgo(2),
          author: { login: 'maya-chen' },
          reviews: { totalCount: 2 },
          latestReviews: {
            nodes: [{ state: 'COMMENTED' }, { state: 'APPROVED' }],
          },
        },
        {
          title: 'Fix checkout tax rounding mismatch for EU invoices',
          url: 'https://github.com/octo-org/billing-service/pull/903',
          repository: { nameWithOwner: 'octo-org/billing-service' },
          createdAt: isoHoursAgo(5),
          author: { login: 'dev-jordan' },
          reviews: { totalCount: 1 },
          latestReviews: {
            nodes: [{ state: 'CHANGES_REQUESTED' }],
          },
        },
        {
          title: 'Add optimistic cache updates for issue assignment',
          url: 'https://github.com/octo-org/platform-ui/pull/1211',
          repository: { nameWithOwner: 'octo-org/platform-ui' },
          createdAt: isoHoursAgo(9),
          author: { login: 'samir-p' },
          reviews: { totalCount: 3 },
          latestReviews: {
            nodes: [{ state: 'APPROVED' }, { state: 'COMMENTED' }],
          },
        },
        {
          title: 'Refactor webhook retry queue into worker pool',
          url: 'https://github.com/octo-org/event-bus/pull/477',
          repository: { nameWithOwner: 'octo-org/event-bus' },
          createdAt: isoHoursAgo(17),
          author: { login: 'renee-dev' },
          reviews: { totalCount: 0 },
          latestReviews: {
            nodes: [],
          },
        },
        {
          title: 'Migrate flaky integration tests to deterministic fixtures',
          url: 'https://github.com/octo-org/qa-tools/pull/332',
          repository: { nameWithOwner: 'octo-org/qa-tools' },
          createdAt: isoHoursAgo(26),
          author: { login: 'eliot-bot' },
          reviews: { totalCount: 2 },
          latestReviews: {
            nodes: [{ state: 'COMMENTED' }],
          },
        },
      ],
    },
    myPRs: {
      issueCount: 4,
      nodes: [
        {
          title: 'Ship compact notifications panel for sidebar',
          url: 'https://github.com/octo-org/platform-ui/pull/1222',
          repository: { nameWithOwner: 'octo-org/platform-ui' },
          createdAt: isoHoursAgo(3),
          reviews: { totalCount: 3 },
        },
        {
          title: 'Add pagination cursor helpers to API SDK',
          url: 'https://github.com/octo-org/sdk-js/pull/619',
          repository: { nameWithOwner: 'octo-org/sdk-js' },
          createdAt: isoHoursAgo(7),
          reviews: { totalCount: 1 },
        },
        {
          title: 'Improve docs: deployment rollback runbook',
          url: 'https://github.com/octo-org/docs/pull/248',
          repository: { nameWithOwner: 'octo-org/docs' },
          createdAt: isoHoursAgo(14),
          reviews: { totalCount: 0 },
        },
        {
          title: 'Reduce bundle size by lazy loading admin charts',
          url: 'https://github.com/octo-org/retail-web/pull/1851',
          repository: { nameWithOwner: 'octo-org/retail-web' },
          createdAt: isoHoursAgo(32),
          reviews: { totalCount: 2 },
        },
      ],
    },
  };
}

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
  const demoFeatureEnabled = $('demo-feature-enabled').checked;
  const demoMode = $('demo-mode').checked;

  if (!demoFeatureEnabled) {
    await chrome.storage.sync.set({ theme, token, demoFeatureEnabled, demoMode: false });
    showMessage('Settings saved.', 'success');
    return;
  }

  if (demoMode) {
    await chrome.storage.sync.set({ token, theme, demoFeatureEnabled, demoMode });
    showMessage('Settings saved. Demo mode is enabled.', 'success');
    return;
  }

  if (!token) {
    showMessage('Please enter a token.', 'error');
    return;
  }

  $('save-btn').disabled = true;
  $('save-btn').textContent = 'Saving...';

  const result = await testToken(token);

  if (result.ok) {
    await chrome.storage.sync.set({ token, theme, demoFeatureEnabled, demoMode });
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
  const { token, theme, demoFeatureEnabled, demoMode } = await chrome.storage.sync.get([
    'token',
    'theme',
    'demoFeatureEnabled',
    'demoMode',
  ]);
  if (token) $('token-input').value = token;
  if (theme) $('theme-select').value = theme;
  $('demo-feature-enabled').checked = Boolean(demoFeatureEnabled);
  $('demo-mode').checked = Boolean(demoMode);
  updateDemoControlsVisibility(Boolean(demoFeatureEnabled));
}

async function generateDemoData() {
  const demoData = buildDemoData();
  await chrome.storage.sync.set({ demoFeatureEnabled: true, demoMode: true, demoData });
  $('demo-feature-enabled').checked = true;
  updateDemoControlsVisibility(true);
  $('demo-mode').checked = true;
  showMessage('Demo data generated. Open the popup to capture screenshots.', 'success');
}

async function clearDemoData() {
  await chrome.storage.sync.remove('demoData');
  await chrome.storage.sync.set({ demoMode: false });
  $('demo-mode').checked = false;
  showMessage('Demo mode disabled and fake data removed.', 'success');
}

function handleDemoFeatureToggle() {
  const enabled = $('demo-feature-enabled').checked;
  updateDemoControlsVisibility(enabled);

  if (!enabled) {
    $('demo-mode').checked = false;
  }
}

document.addEventListener('DOMContentLoaded', loadSettings);
$('save-btn').addEventListener('click', saveToken);
$('test-btn').addEventListener('click', testTokenOnly);
$('generate-demo-btn').addEventListener('click', generateDemoData);
$('clear-demo-btn').addEventListener('click', clearDemoData);
$('demo-feature-enabled').addEventListener('change', handleDemoFeatureToggle);
