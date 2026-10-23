const DEFAULT_SETTINGS = { showInlineCount: true, showFloatingCount: true, enableShortcuts: false };

async function init() {
  const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
  for (const checkbox of document.querySelectorAll("input[type=checkbox]")) {
    checkbox.checked = settings[checkbox.name];
    checkbox.addEventListener("change", () => {
      browser.storage.sync.set({ [checkbox.name]: checkbox.checked });
    });
  }
}

init();
