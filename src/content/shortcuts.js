import { findNeighborCommitButton, isDisabled, isEditable, parseCommitView } from "./gitlab-page.js";

const SHORTCUT_DIRECTIONS = Object.freeze({ p: "previous", n: "next" });

const hasModifier = ({ ctrlKey, metaKey, altKey }) => ctrlKey || metaKey || altKey;

export const createShortcutHandler = ({ isEnabled }) => (event) => {
  const direction = SHORTCUT_DIRECTIONS[event.key];
  const isCommitShortcut = Boolean(direction) && !hasModifier(event) && !isEditable(event.target);
  if (!isEnabled() || !isCommitShortcut || !parseCommitView(location)) return;

  const button = findNeighborCommitButton(direction);
  if (!button || isDisabled(button)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  button.click();
};
