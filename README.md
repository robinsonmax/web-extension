# Page Tweaks

A small Manifest V3 Chrome extension scaffold written in TypeScript. The popup provides one toggle per feature; the options page lets you set the sites each feature applies to.

## Build

Install the development dependencies and compile the TypeScript (pnpm):

```sh
pnpm install
pnpm run build
```

The build writes JavaScript to `dist/` and removes generated feature folders that are no longer listed in `src/features.ts`. Load this folder as an unpacked extension after building.

## Load in Chrome

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Use the extension popup to enable a feature. Chrome will ask for access to its configured sites.

## Add a tweak

1. Add a feature entry to `src/features.ts`, including a unique `id`, title, description, default `matches`, and the CSS/JS file paths under `dist/`.
2. Create the referenced TypeScript file under `src/features/<id>/` and put CSS or other static assets in `features/<id>/`. The build copies feature assets recursively into `dist/features/`.
3. Run `pnpm run build`, then reload the extension from `chrome://extensions`.

Feature scripts are content scripts and run in an isolated world. Use `chrome.scripting.executeScript` with `world: "MAIN"` if a feature specifically needs access to page-owned JavaScript state. This scaffold injects enabled feature files on page loads and updates already-open matching tabs when a feature is enabled. Chrome's built-in pages and the Chrome Web Store do not allow extensions to inject scripts.
