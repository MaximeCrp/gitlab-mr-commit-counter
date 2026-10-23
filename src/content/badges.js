import { findNavButtons } from "./gitlab-page.js";

const BADGE_CLASS = "mr-commit-counter";

const variantClass = (variant) => `${BADGE_CLASS}--${variant}`;

const findBadge = (variant) => document.querySelector(`.${variantClass(variant)}`);

const createBadge = (variant) => {
  const badge = document.createElement("span");
  badge.classList.add(BADGE_CLASS, variantClass(variant));
  return badge;
};

const placeFloatingBadge = (isEnabled) => {
  const floating = findBadge("floating");
  if (!isEnabled) {
    floating?.remove();
    return null;
  }
  if (floating) return floating;

  const created = createBadge("floating");
  document.body.append(created);
  return created;
};

const placeInlineBadge = (isEnabled) => {
  const navButtons = findNavButtons();
  const inline = findBadge("inline");
  const isPlacedAfterNav = Boolean(inline) && navButtons?.nextElementSibling === inline;
  if (isEnabled && isPlacedAfterNav) return inline;

  inline?.remove();
  if (!isEnabled || !navButtons) return null;

  const created = createBadge("inline");
  navButtons.after(created);
  return created;
};

const applyLabel = (badge, { text, title }) => {
  if (badge.textContent !== text) badge.textContent = text;
  if (badge.title !== title) badge.title = title;
};

export const paintBadges = (label, { showFloatingCount, showInlineCount }) => {
  const badges = [placeFloatingBadge(showFloatingCount), placeInlineBadge(showInlineCount)].filter(Boolean);
  badges.forEach((badge) => applyLabel(badge, label));
};

export const removeBadges = () => {
  document.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
};
