import { DEFAULT_SETTINGS, loadSettings, onSettingsChange } from "../shared/settings.js";
import { paintBadges, removeBadges } from "./badges.js";
import { createCommitCache } from "./commit-cache.js";
import { LOADING_LABEL, describeCommitPosition, describeLoadError } from "./commit-position.js";
import { fetchCommitIds, fetchHeadSha } from "./gitlab-api.js";
import { parseCommitView } from "./gitlab-page.js";
import { createShortcutHandler } from "./shortcuts.js";

const RENDER_INTERVAL_MS = 500;

const commitCache = createCommitCache({ fetchHeadSha, fetchCommitIds });
const state = { settings: { ...DEFAULT_SETTINGS }, href: null, label: null };

const loadLabel = async (commitView, href) => {
  const label = await commitCache
    .getCommitIds(commitView)
    .then((commitIds) => describeCommitPosition(commitIds, commitView.commitId), describeLoadError);
  const isStillViewed = state.href === href;
  if (!isStillViewed) return;

  state.label = label;
  paintBadges(state.label, state.settings);
};

const resetView = () => {
  removeBadges();
  state.href = null;
  state.label = null;
};

const render = () => {
  const commitView = parseCommitView(location);
  if (!commitView) return resetView();

  const hasNavigated = state.href !== location.href;
  if (hasNavigated) {
    state.href = location.href;
    state.label = LOADING_LABEL;
    loadLabel(commitView, state.href);
  }
  paintBadges(state.label, state.settings);
};

const applySettings = (settings) => {
  state.settings = settings;
  render();
};

const start = async () => {
  window.addEventListener("keydown", createShortcutHandler({ isEnabled: () => state.settings.enableShortcuts }), true);
  onSettingsChange(applySettings);
  applySettings(await loadSettings());
  setInterval(render, RENDER_INTERVAL_MS);
};

start();
