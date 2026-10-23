const BADGE_CLASS = "mr-commit-counter";
const PER_PAGE = 100;
const VERSION_CHECK_COOLDOWN_MS = 30_000;
const NAV_BUTTONS_SELECTOR = '.commit-nav-buttons, [data-testid="commit-nav-buttons"]';
const DEFAULT_SETTINGS = { showInlineCount: true, showFloatingCount: true, enableShortcuts: false };
const mergeRequests = new Map();
let settings = { ...DEFAULT_SETTINGS };

const pageFetch = typeof content !== "undefined" && content.fetch ? content.fetch : fetch;

function parseLocation() {
  const match = location.pathname.match(/^\/(.+?)\/-\/merge_requests\/(\d+)\/diffs/);
  const commitId = new URLSearchParams(location.search).get("commit_id");
  if (!match || !commitId) return null;
  return { projectPath: match[1], iid: match[2], commitId };
}

async function apiGet(path) {
  const response = await pageFetch(`/api/v4${path}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`GitLab API ${response.status}`);
  return response.json();
}

function mergeRequestPath({ projectPath, iid }) {
  return `/projects/${encodeURIComponent(projectPath)}/merge_requests/${iid}`;
}

async function fetchHeadSha(target) {
  const mergeRequest = await apiGet(mergeRequestPath(target));
  return mergeRequest.sha;
}

async function fetchCommitIds(target) {
  const ids = [];
  for (let page = 1; ; page++) {
    const commits = await apiGet(`${mergeRequestPath(target)}/commits?per_page=${PER_PAGE}&page=${page}`);
    ids.push(...commits.map((commit) => commit.id));
    if (commits.length < PER_PAGE) break;
  }
  return ids.reverse();
}

function getMergeRequest(target) {
  const key = `${target.projectPath}!${target.iid}`;
  if (!mergeRequests.has(key)) {
    mergeRequests.set(key, { headSha: null, commitIds: null, checkedAt: 0, pending: null });
  }
  return mergeRequests.get(key);
}

function refresh(mergeRequest, target, { forceCommits }) {
  mergeRequest.pending ??= (async () => {
    const headSha = await fetchHeadSha(target);
    const isNewVersion = headSha !== mergeRequest.headSha;
    if (forceCommits || isNewVersion || !mergeRequest.commitIds) {
      mergeRequest.commitIds = await fetchCommitIds(target);
      mergeRequest.headSha = headSha;
    }
    mergeRequest.checkedAt = Date.now();
  })().finally(() => {
    mergeRequest.pending = null;
  });
  return mergeRequest.pending;
}

function containsCommit(commitIds, commitId) {
  return commitIds.some((id) => id.startsWith(commitId));
}

async function getCommitIds(target) {
  const mergeRequest = getMergeRequest(target);
  const isVersionCheckDue = Date.now() - mergeRequest.checkedAt > VERSION_CHECK_COOLDOWN_MS;
  const didRefresh = Boolean(mergeRequest.pending) || isVersionCheckDue;
  if (didRefresh) await refresh(mergeRequest, target, { forceCommits: false });

  if (!didRefresh && !containsCommit(mergeRequest.commitIds, target.commitId)) {
    await refresh(mergeRequest, target, { forceCommits: true });
  }
  return mergeRequest.commitIds;
}

function createBadge(variant) {
  const badge = document.createElement("span");
  badge.classList.add(BADGE_CLASS, `${BADGE_CLASS}--${variant}`);
  return badge;
}

function placeFloatingBadge() {
  let floating = document.querySelector(`.${BADGE_CLASS}--floating`);
  if (!settings.showFloatingCount) {
    floating?.remove();
    return null;
  }
  if (!floating) {
    floating = createBadge("floating");
    document.body.append(floating);
  }
  return floating;
}

function placeInlineBadge() {
  const navButtons = document.querySelector(NAV_BUTTONS_SELECTOR);
  let inline = document.querySelector(`.${BADGE_CLASS}--inline`);
  const isPlacedAfterNav = inline && navButtons && navButtons.nextElementSibling === inline;
  if (settings.showInlineCount && isPlacedAfterNav) return inline;

  inline?.remove();
  if (!settings.showInlineCount || !navButtons) return null;
  inline = createBadge("inline");
  navButtons.after(inline);
  return inline;
}

function placeBadges() {
  return [placeFloatingBadge(), placeInlineBadge()].filter(Boolean);
}

function removeBadges() {
  document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
}

let badgeContent = { href: null, text: "", title: "" };

function paintBadges() {
  for (const badge of placeBadges()) {
    if (badge.textContent !== badgeContent.text) badge.textContent = badgeContent.text;
    if (badge.title !== badgeContent.title) badge.title = badgeContent.title;
  }
}

async function loadBadgeContent(target, href) {
  let text;
  let title;
  try {
    const commitIds = await getCommitIds(target);
    const position = commitIds.findIndex((id) => id.startsWith(target.commitId)) + 1;
    text = `${position || "?"} / ${commitIds.length}`;
    title = position ? `Commit ${position} of ${commitIds.length}` : "Commit not found in this merge request";
  } catch (error) {
    text = "? / ?";
    title = `Could not load commits: ${error.message}`;
  }
  if (badgeContent.href !== href) return;
  badgeContent = { href, text, title };
  paintBadges();
}

function render() {
  const target = parseLocation();
  if (!target) {
    removeBadges();
    badgeContent = { href: null, text: "", title: "" };
    return;
  }

  const href = location.href;
  if (badgeContent.href !== href) {
    badgeContent = { href, text: "… / …", title: "Loading commits" };
    loadBadgeContent(target, href);
  }
  paintBadges();
}

const SHORTCUT_DIRECTIONS = { p: "previous", n: "next" };

function isTypingIn(element) {
  return Boolean(element.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}

function findNeighborCommitButton(direction) {
  const navButtons = document.querySelector(NAV_BUTTONS_SELECTOR);
  const buttons = navButtons ? [...navButtons.querySelectorAll("a, button")] : [];
  return direction === "previous" ? buttons[0] : buttons.at(-1);
}

function isDisabled(button) {
  return button.matches(':disabled, .disabled, [aria-disabled="true"]');
}

function handleCommitShortcut(event) {
  const direction = SHORTCUT_DIRECTIONS[event.key];
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
  if (!settings.enableShortcuts || !direction || hasModifier || isTypingIn(event.target) || !parseLocation()) return;

  const button = findNeighborCommitButton(direction);
  if (!button || isDisabled(button)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  button.click();
}

async function loadSettings() {
  try {
    settings = { ...DEFAULT_SETTINGS, ...(await browser.storage.sync.get(DEFAULT_SETTINGS)) };
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
}

browser.storage.onChanged.addListener(async (_changes, area) => {
  if (area !== "sync") return;
  await loadSettings();
  render();
});

window.addEventListener("keydown", handleCommitShortcut, true);
loadSettings().then(() => {
  render();
  setInterval(render, 500);
});
