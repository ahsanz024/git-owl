const GITHUB_API = 'https://api.github.com/graphql';

const SEARCH_QUERY = `
  query {
    reviewRequests: search(
      query: "is:open is:pr review-requested:@me"
      type: ISSUE
      first: 50
    ) {
      issueCount
      nodes {
        ... on PullRequest {
          title
          url
          repository { nameWithOwner }
          createdAt
          author { login }
          reviews { totalCount }
          latestReviews(first: 3) {
            nodes { state }
          }
        }
      }
    }
    myPRs: search(
      query: "is:open is:pr author:@me -draft:true"
      type: ISSUE
      first: 50
    ) {
      issueCount
      nodes {
        ... on PullRequest {
          title
          url
          repository { nameWithOwner }
          createdAt
          reviews { totalCount }
        }
      }
    }
  }
`;

function $(id) { return document.getElementById(id); }

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

async function fetchPRs(token) {
  const res = await fetch(GITHUB_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SEARCH_QUERY }),
  });

  const body = await res.json();

  if (!res.ok) {
    if (res.status === 401) throw new Error('Token is invalid or expired. Update it in Settings.');
    if (res.status === 403) throw new Error('Rate limit exceeded. Try again later.');
    throw new Error(`GitHub API error (${res.status})`);
  }

  if (body.errors) {
    const msgs = body.errors.map(e => e.message).join('; ');
    throw new Error(msgs || 'Unknown GitHub error');
  }

  if (!body.data) {
    throw new Error('Unexpected response from GitHub');
  }

  return body.data;
}

function renderPRList(containerId, nodes, mode) {
  const list = $(containerId);
  list.innerHTML = '';

  if (!nodes || nodes.length === 0) {
    list.innerHTML = '<div class="empty-state">Nothing here &#10003;</div>';
    return;
  }

  for (const pr of nodes) {
    const item = document.createElement('li');
    item.className = 'pr-item';

    const repoName = pr.repository.nameWithOwner;
    const prNumber = pr.url.split('/').pop();

    let reviewHtml = '';
    if (mode === 'to-review' && pr.reviews && pr.latestReviews) {
      const reviewStatus = computeReviewStatus(pr);
      if (reviewStatus) {
        reviewHtml = `<span class="pr-meta-sep">&#183;</span> <span class="${reviewStatus.class}">${reviewStatus.text}</span>`;
      }
    } else if (pr.reviews !== undefined) {
      reviewHtml = `<span class="pr-meta-sep">&#183;</span> <span class="pr-review-count">${pr.reviews.totalCount} review${pr.reviews.totalCount !== 1 ? 's' : ''}</span>`;
    }

    item.innerHTML = `
      <div class="pr-title">${escapeHtml(pr.title)}</div>
      <div class="pr-meta">
        <span class="pr-repo">${escapeHtml(repoName)}</span>
        <span class="pr-meta-sep">#${prNumber}</span>
        ${pr.author ? `<span class="pr-meta-sep">&#183;</span> <span>by ${escapeHtml(pr.author.login)}</span>` : ''}
        ${reviewHtml}
        <span class="pr-meta-sep">&#183;</span>
        <span>${relativeTime(pr.createdAt)}</span>
      </div>
    `;

    item.addEventListener('click', () => chrome.tabs.create({ url: pr.url }));

    list.appendChild(item);
  }
}

function computeReviewStatus(pr) {
  const count = pr.reviews.totalCount;
  if (count === 0) return null;

  const states = (pr.latestReviews.nodes || []).map(n => n.state);
  const meaningful = states.filter(s => s !== 'DISMISSED' && s !== 'PENDING');

  if (meaningful.includes('APPROVED')) {
    return { text: '✓ Approved', class: 'review-approved' };
  }
  if (meaningful.includes('CHANGES_REQUESTED')) {
    return { text: '⛔ Changes requested', class: 'review-changes' };
  }
  if (meaningful.includes('COMMENTED')) {
    return { text: '💬 Reviewed', class: 'review-commented' };
  }
  return { text: `${count} review${count !== 1 ? 's' : ''}`, class: 'review-muted' };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateBadge(count) {
  const text = count > 99 ? '99+' : String(count);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: count > 0 ? '#dbab09' : '#28a745' });
}

async function main() {
  show('loading');
  hide('no-token');
  hide('error');
  hide('results');

  const { token } = await chrome.storage.sync.get('token');

  if (!token) {
    hide('loading');
    show('no-token');
    return;
  }

  try {
    const data = await fetchPRs(token);

    const reviewCount = data.reviewRequests.issueCount;
    const myPRCount = data.myPRs.issueCount;

    $('to-review-count').textContent = reviewCount;
    $('my-prs-count').textContent = myPRCount;

    renderPRList('to-review-list', data.reviewRequests.nodes, 'to-review');
    renderPRList('my-prs-list', data.myPRs.nodes);

    updateBadge(reviewCount + myPRCount);

    hide('loading');
    show('results');

    $('status-text').textContent = 'Updated just now';
  } catch (err) {
    hide('loading');
    show('error');
    $('error-msg').textContent = err.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  main();
  initTabs();
});

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      document.querySelector('.tab-panel.active').classList.remove('active');
      tab.classList.add('active');
      $(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

$('open-settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('retry-btn').addEventListener('click', main);
$('refresh-btn').addEventListener('click', main);
