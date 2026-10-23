const MERGE_REQUEST_DIFFS_PATH = /^\/(.+?)\/-\/merge_requests\/(\d+)\/diffs/;
const NAV_BUTTONS_SELECTOR = '.commit-nav-buttons, [data-testid="commit-nav-buttons"]';
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const DISABLED_SELECTOR = ':disabled, .disabled, [aria-disabled="true"]';
const LAST_INDEX = -1;

export const parseCommitView = ({ pathname, search }) => {
  const match = pathname.match(MERGE_REQUEST_DIFFS_PATH);
  const commitId = new URLSearchParams(search).get("commit_id");
  if (!match || !commitId) return null;
  return { projectPath: match[1], iid: match[2], commitId };
};

export const findNavButtons = () => document.querySelector(NAV_BUTTONS_SELECTOR);

export const findNeighborCommitButton = (direction) => {
  const buttons = [...(findNavButtons()?.querySelectorAll("a, button") ?? [])];
  const [previousButton] = buttons;
  const nextButton = buttons.at(LAST_INDEX);
  return direction === "previous" ? previousButton : nextButton;
};

export const isDisabled = (button) => button.matches(DISABLED_SELECTOR);

export const isEditable = (element) => Boolean(element.closest?.(EDITABLE_SELECTOR));
