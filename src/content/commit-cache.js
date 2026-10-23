import { containsCommit } from "./commit-position.js";

const VERSION_CHECK_COOLDOWN_MS = 30_000;

const mergeRequestKey = ({ projectPath, iid }) => `${projectPath}!${iid}`;

const createEntry = () => ({ headSha: null, commitIds: null, checkedAt: 0, pending: null });

export const createCommitCache = ({ fetchHeadSha, fetchCommitIds, cooldownMs = VERSION_CHECK_COOLDOWN_MS }) => {
  const entries = new Map();

  const getEntry = (mergeRequest) => {
    const key = mergeRequestKey(mergeRequest);
    if (!entries.has(key)) entries.set(key, createEntry());
    return entries.get(key);
  };

  const syncEntry = async (entry, mergeRequest, { forceCommits }) => {
    const headSha = await fetchHeadSha(mergeRequest);
    const isNewVersion = headSha !== entry.headSha;
    if (forceCommits || isNewVersion || !entry.commitIds) {
      entry.commitIds = await fetchCommitIds(mergeRequest);
      entry.headSha = headSha;
    }
    entry.checkedAt = Date.now();
  };

  const refresh = (entry, mergeRequest, options) => {
    entry.pending ??= syncEntry(entry, mergeRequest, options).finally(() => {
      entry.pending = null;
    });
    return entry.pending;
  };

  const getCommitIds = async (commitView) => {
    const entry = getEntry(commitView);
    const isVersionCheckDue = Date.now() - entry.checkedAt > cooldownMs;
    const shouldCheckVersion = Boolean(entry.pending) || isVersionCheckDue;
    if (shouldCheckVersion) {
      await refresh(entry, commitView, { forceCommits: false });
      return entry.commitIds;
    }

    if (!containsCommit(entry.commitIds, commitView.commitId)) {
      await refresh(entry, commitView, { forceCommits: true });
    }
    return entry.commitIds;
  };

  return { getCommitIds };
};
