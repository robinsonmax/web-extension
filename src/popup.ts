import { FEATURES, mergeSettings, type FeatureSettings } from "./features.js";

const list = document.querySelector<HTMLDivElement>("#feature-list")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const stored = await chrome.storage.sync.get("features");
const settings: FeatureSettings = mergeSettings(stored.features);

for (const feature of FEATURES) {
  const setting = settings[feature.id];
  const row = document.createElement("label");
  row.className = "feature-row";
  const text = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = feature.title;
  const description = document.createElement("small");
  description.textContent = feature.description;
  text.append(title, description);
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = Boolean(setting.enabled);
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-label", `Enable ${feature.title}`);
  row.append(text, toggle);
  list.append(row);

  const accessButton = document.createElement("button");
  accessButton.textContent = "Grant site access";
  accessButton.hidden = !setting.enabled || await chrome.permissions.contains({ origins: setting.matches });
  accessButton.addEventListener("click", async () => {
    const granted = await chrome.permissions.request({ origins: setting.matches });
    if (!granted) {
      status.textContent = "Chrome did not grant access to this site.";
      return;
    }
    await chrome.storage.sync.set({ features: settings });
    accessButton.hidden = true;
    status.textContent = "Site access granted. The matching open page is being updated.";
  });
  list.append(accessButton);

  toggle.addEventListener("change", async () => {
    status.textContent = "";
    const matches = setting.matches ?? feature.matches;
    if (toggle.checked) {
      const granted = await chrome.permissions.request({ origins: matches });
      if (!granted) {
        toggle.checked = false;
        status.textContent = "Site access is needed to enable this tweak.";
        return;
      }
    }
    setting.enabled = toggle.checked;
    await chrome.storage.sync.set({ features: settings });
    accessButton.hidden = !toggle.checked;
    status.textContent = toggle.checked
      ? "Enabled. Matching open pages are updated now."
      : "Disabled. It will stop running on the next page load.";
  });
}
