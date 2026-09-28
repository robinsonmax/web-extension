import { FEATURES, mergeSettings, type FeatureSettings } from "./features.js";

const list = document.querySelector<HTMLDivElement>("#feature-list")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const stored = await chrome.storage.sync.get("features");
const settings: FeatureSettings = mergeSettings(stored.features);

for (const feature of FEATURES) {
  const setting = settings[feature.id];
  const card = document.createElement("section");
  card.className = "feature-card";
  const title = document.createElement("h2");
  title.textContent = feature.title;
  const description = document.createElement("p");
  description.textContent = feature.description;
  const label = document.createElement("label");
  label.textContent = "Page match patterns (one per line)";
  const input = document.createElement("textarea");
  input.rows = 3;
  input.spellcheck = false;
  input.value = (setting.matches ?? feature.matches).join("\n");
  label.append(input);
  const save = document.createElement("button");
  save.textContent = "Save matches";
  save.addEventListener("click", async () => {
    const matches = input.value.split("\n").map((item) => item.trim()).filter(Boolean);
    if (!matches.length || matches.some((pattern) => !/^(\*|https?):\/\//.test(pattern))) {
      status.textContent = "Enter at least one valid-looking match pattern (for example, https://example.com/*).";
      return;
    }
    if (setting.enabled) {
      const granted = await chrome.permissions.request({ origins: matches });
      if (!granted) {
        status.textContent = "Chrome did not grant access to the new page patterns. The previous settings are unchanged.";
        return;
      }
    }
    setting.matches = matches;
    await chrome.storage.sync.set({ features: settings });
    status.textContent = "Page matches saved. Matching open pages are updated now if the feature is enabled.";
  });
  card.append(title, description, label, save);
  list.append(card);
}
