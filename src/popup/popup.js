import { loadSettings, saveSetting } from "../shared/settings.js";

const bindCheckbox = (checkbox, settings) => {
  checkbox.checked = settings[checkbox.name];
  checkbox.addEventListener("change", () => saveSetting(checkbox.name, checkbox.checked));
};

const init = async () => {
  const settings = await loadSettings();
  document.querySelectorAll("input[type=checkbox]").forEach((checkbox) => bindCheckbox(checkbox, settings));
};

init();
