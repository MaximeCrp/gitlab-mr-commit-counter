export const DEFAULT_SETTINGS = Object.freeze({
  showInlineCount: true,
  showFloatingCount: true,
  enableShortcuts: false,
});

export const loadSettings = async () => {
  try {
    return { ...DEFAULT_SETTINGS, ...(await browser.storage.sync.get(DEFAULT_SETTINGS)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSetting = (name, value) => browser.storage.sync.set({ [name]: value });

export const onSettingsChange = (listener) => {
  browser.storage.onChanged.addListener(async (_changes, area) => {
    if (area === "sync") listener(await loadSettings());
  });
};
