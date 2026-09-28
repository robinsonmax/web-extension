import { FEATURES, mergeSettings, type FeatureSettings } from "./features.js";

async function getSettings(): Promise<FeatureSettings> {
  const stored = await chrome.storage.sync.get("features");
  return mergeSettings(stored.features);
}

function urlMatchesPattern(urlString: string, pattern: string): boolean {
  try {
    const url = new URL(urlString);
    const [scheme, rest] = pattern.split("://");
    if (!rest) return false;
    const slash = rest.indexOf("/");
    const hostPattern = slash === -1 ? rest : rest.slice(0, slash);
    const pathPattern = slash === -1 ? "/*" : rest.slice(slash);
    if (scheme !== "*" && `${scheme}:` !== url.protocol) return false;
    const hostOk = hostPattern === "*" ||
      (hostPattern.startsWith("*.")
        ? url.hostname === hostPattern.slice(2) || url.hostname.endsWith(`.${hostPattern.slice(2)}`)
        : url.hostname === hostPattern);
    const pathRegex = new RegExp(`^${pathPattern.split("*").map(escapeRegex).join(".*")}$`);
    return hostOk && pathRegex.test(url.pathname);
  } catch {
    return false;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

async function injectForTab(tabId: number, url: string | undefined): Promise<void> {
  if (!url || !/^https?:/.test(url)) return;
  const settings = await getSettings();
  for (const feature of FEATURES) {
    const setting = settings[feature.id];
    const matches = setting?.matches ?? feature.matches;
    if (!setting?.enabled || !matches.some((pattern) => urlMatchesPattern(url, pattern))) continue;
    try {
      const origins = matches.filter((pattern) => urlMatchesPattern(url, pattern));
      if (!await chrome.permissions.contains({ origins })) {
        console.warn(`Missing site access for ${url}; update and save the feature's match patterns in extension settings.`);
        continue;
      }
      if (feature.css) await chrome.scripting.insertCSS({ target: { tabId }, files: [feature.css] });
      if (feature.js) await chrome.scripting.executeScript({ target: { tabId }, files: [feature.js] });
      console.info(`Injected ${feature.id} into ${url}`);
    } catch (error) {
      console.warn(`Could not inject ${feature.id}:`, error);
    }
  }
}

async function injectIntoOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => tab.id !== undefined && tab.status === "complete")
      .map((tab) => injectForTab(tab.id!, tab.url)),
  );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") void injectForTab(tabId, tab.url);
});

// Also handle pages that were already open when the extension was loaded or enabled.
chrome.runtime.onInstalled.addListener(() => void injectIntoOpenTabs());
chrome.runtime.onStartup.addListener(() => void injectIntoOpenTabs());
chrome.permissions.onAdded.addListener(() => void injectIntoOpenTabs());
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.features) void injectIntoOpenTabs();
});
