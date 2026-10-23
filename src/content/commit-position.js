export const LOADING_LABEL = Object.freeze({ text: "… / …", title: "Loading commits" });

const NOT_FOUND_INDEX = -1;

const isSameCommit = (fullId, commitId) => fullId.startsWith(commitId);

const toPosition = (index) => index + 1;

export const containsCommit = (commitIds, commitId) => commitIds.some((id) => isSameCommit(id, commitId));

export const describeCommitPosition = (commitIds, commitId) => {
  const index = commitIds.findIndex((id) => isSameCommit(id, commitId));
  const total = commitIds.length;
  if (index === NOT_FOUND_INDEX) return { text: `? / ${total}`, title: "Commit not found in this merge request" };

  const position = toPosition(index);
  return { text: `${position} / ${total}`, title: `Commit ${position} of ${total}` };
};

export const describeLoadError = (error) => ({ text: "? / ?", title: `Could not load commits: ${error.message}` });
