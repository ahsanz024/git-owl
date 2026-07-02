# Privacy Policy

**Last updated:** July 2, 2026

## Overview

GitOwl is a Chrome extension that displays your GitHub pull request review status. It operates entirely in your browser and does not collect, store, or transmit any personal data to third parties.

## Data Collection

GitOwl does **not** collect, sell, or share any personal data. The extension does not use analytics, tracking, or telemetry of any kind.

## Data Storage

The only data stored by GitOwl is:

- **GitHub Personal Access Token** — You enter this in the extension's settings page. It is saved to your browser's `chrome.storage.sync` and is used solely to authenticate requests to the GitHub API. This token is never transmitted to any server other than `api.github.com`.

No other user data is created, stored, or cached by the extension.

## Network Requests

GitOwl makes a single authenticated network request to `https://api.github.com/graphql` each time you open the popup. This request:

- Includes your token in the `Authorization` header
- Fetches pull request metadata (titles, URLs, repository names, review counts, author logins, timestamps)
- Does **not** send any identifying information beyond the token itself

No other network requests are made. No data is sent to any third-party server.

## Third-Party Services

The only external service GitOwl communicates with is the GitHub GraphQL API (`api.github.com`). Your use of that service is governed by [GitHub's Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

## Data Sharing

GitOwl does not share any data with any third party. There are no embedded third-party scripts, trackers, or analytics.

## Changes to This Policy

If this policy changes, the "Last updated" date at the top will be revised. Since the extension is open source, you can also track changes to this document in the repository history.

## Contact

For questions about this privacy policy, open an issue at:

[https://github.com/ahsanz024/git-owl/issues](https://github.com/ahsanz024/git-owl/issues)

---

*This extension is not affiliated with, sponsored by, or endorsed by GitHub, Inc. GitHub is a registered trademark of GitHub, Inc.*
