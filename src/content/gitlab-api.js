const COMMITS_PER_PAGE = 100;
const FIRST_PAGE = 1;

const pageFetch = typeof content !== "undefined" && content.fetch ? content.fetch : fetch;

const apiGet = async (path) => {
  const response = await pageFetch(`/api/v4${path}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`GitLab API ${response.status}`);
  return response.json();
};

const mergeRequestPath = ({ projectPath, iid }) =>
  `/projects/${encodeURIComponent(projectPath)}/merge_requests/${iid}`;

export const fetchHeadSha = async (mergeRequest) => {
  const { sha } = await apiGet(mergeRequestPath(mergeRequest));
  return sha;
};

export const fetchCommitIds = async (mergeRequest) => {
  const ids = [];
  for (let page = FIRST_PAGE; ; page++) {
    const commits = await apiGet(`${mergeRequestPath(mergeRequest)}/commits?per_page=${COMMITS_PER_PAGE}&page=${page}`);
    ids.push(...commits.map(({ id }) => id));
    const isLastPage = commits.length < COMMITS_PER_PAGE;
    if (isLastPage) return ids.reverse();
  }
};
