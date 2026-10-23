# <img src="src/icons/icon.svg" alt="" width="32" height="32" align="top"> GitLab MR Commit Counter

Firefox extension that shows which commit you are viewing (e.g. `3 / 17`) when reviewing a GitLab merge request commit by commit.

- Count next to the Previous / Next buttons and in a floating badge
- Optional `p` / `n` shortcuts for previous / next commit (in addition to GitLab's `x` / `c`)
- Settings in the toolbar popup or the add-on preferences
- Works on gitlab.com and self-hosted instances, using your GitLab session (no token)

## Install

```sh
pnpm install
pnpm build
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** and pick `dist/manifest.json`

## Development

| Command | Description |
| --- | --- |
| `pnpm build` | Bundle `src/` into `dist/` |
| `pnpm watch` | Rebuild on change |
| `pnpm start` | Run Firefox with the extension loaded |
| `pnpm lint` | Lint the built extension with `web-ext` |
| `pnpm package` | Build a zip in `web-ext-artifacts/` |

```
src/
├── manifest.json
├── icons/
├── shared/settings.js      settings defaults and storage
├── content/                content script injected in merge request pages
│   ├── index.js            entry point: render loop and wiring
│   ├── gitlab-page.js      URL parsing and GitLab DOM lookups
│   ├── gitlab-api.js       GitLab REST API calls
│   ├── commit-cache.js     commit list cache per merge request
│   ├── commit-position.js  position label
│   ├── badges.js           inline and floating badges
│   ├── shortcuts.js        p / n shortcuts
│   └── content.css
└── popup/                  settings popup, also used as the preferences page
scripts/build.mjs           esbuild bundling and static files copy
```
