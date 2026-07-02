# GitOwl

A Chrome extension that gives you a one-click overview of all pull requests awaiting your review, and your own PRs waiting for feedback.

## Features

- **To Review** — See every open PR where your review has been requested
- **My PRs** — See all your open PRs with review counts at a glance
- **Badge count** — The toolbar icon shows how many PRs need your attention
- **Click to open** — Click any PR to jump straight to it on GitHub
- **Privacy-first** — Your token stays in your browser, no external servers

## Installation

### From Chrome Web Store

<!-- TODO: Add link once published -->

### Manual (Developer Mode)

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle top-right)
4. Click **Load unpacked**
5. Select the `github-pr-review-extension` folder

## Quick Start

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens/new?description=PR+Review+Tracker&scopes=repo) with `repo` scope (or `public_repo` for public repos only)
2. Click the extension icon in the toolbar → **Open Settings**
3. Paste your token and click **Save**
4. Click the extension icon again to see your PRs

## Screenshots

<!-- TODO: Add screenshots -->
<!-- ![Popup screenshot](screenshots/popup.png) -->
<!-- ![Settings screenshot](screenshots/settings.png) -->

## How It Works

The extension uses the GitHub GraphQL API to fetch your PR data in a single query:

```graphql
query {
  reviewRequests: search(query: "is:open is:pr review-requested:@me", type: ISSUE, first: 50) {
    issueCount
    nodes { ... on PullRequest { title url repository { nameWithOwner } createdAt author { login } } }
  }
  myPRs: search(query: "is:open is:pr author:@me -draft:true", type: ISSUE, first: 50) {
    issueCount
    nodes { ... on PullRequest { title url repository { nameWithOwner } createdAt reviews { totalCount } } }
  }
}
```

Data is fetched only when you open the popup — no background polling, no unnecessary API calls.

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks)
- GitHub GraphQL API v4
- `chrome.storage.sync` for token storage

## Development

```bash
# Generate icons (if editing them)
node scripts/generate-icons.js
```

### Loading the extension

1. Run `node scripts/generate-icons.js` (icons are pre-generated in the repo)
2. Go to `chrome://extensions`, enable Developer mode
3. Click **Load unpacked** and select the project root

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome-thing`)
3. Commit your changes (`git commit -am 'Add awesome thing'`)
4. Push (`git push origin feature/awesome-thing`)
5. Open a Pull Request

## License

MIT
