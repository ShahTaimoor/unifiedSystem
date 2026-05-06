# PWA (Progressive Web App) Documentation

This document describes how the **Gultraders** app is set up as a Progressive Web App using **Vite** and **vite-plugin-pwa**.

---

## Table of Contents

1. [How It Works (Flow)](#how-it-works-flow)
2. [Overview](#overview)
3. [Tech Stack](#tech-stack)
3. [Configuration](#configuration)
4. [Web App Manifest](#web-app-manifest)
5. [Service Worker & Caching](#service-worker--caching)
6. [Install Prompt (Add to Home Screen)](#install-prompt-add-to-home-screen)
7. [HTML Meta Tags](#html-meta-tags)
8. [Testing & Deployment](#testing--deployment)
9. [Troubleshooting](#troubleshooting)

---

## How It Works (Flow)

This section explains **how your PWA works** from build to install to updates.

### 1. Build time (`npm run build`)

When you run a production build:

1. **Vite** bundles your app into `client/dist/`.
2. **vite-plugin-pwa** runs and:
   - Generates a **service worker** file (e.g. `sw.js` or similar) using Workbox. This file contains precache lists and runtime caching rules.
   - Generates **`manifest.webmanifest`** from the `manifest` block in `vite.config.js` (name, icons, theme, display, etc.).
3. The plugin also **injects** a small script into your app that **registers** the service worker when the app loads.

So after build you have: **app code + service worker + manifest + auto-registration**.

---

### 2. First visit (user opens your site)

1. Browser loads **index.html** (from the server).
2. Browser loads your **JS bundle**. That bundle includes the **injected registration code**.
3. Registration code runs and **registers the service worker** (points the browser to the generated `sw.js`).
4. The service worker **installs** and:
   - **Precaches** all assets matching `globPatterns` (JS, CSS, icons, fonts, etc.) — so next time they can be served from cache.
   - Sets up **runtime caching** (e.g. NetworkFirst for HTML, CacheFirst for images, StaleWhileRevalidate for JS/CSS).
5. Your app runs as usual. The manifest is already linked in `index.html` (`<link rel="manifest" href="/manifest.webmanifest" />`), so the browser knows the app is **installable**.

---

### 3. Install (Add to Home Screen)

1. When install criteria are met (HTTPS, valid manifest, etc.), the browser may fire **`beforeinstallprompt`**.
2. Your code in **BottomNavigation.jsx** catches this event, stores it (`deferredPrompt`), and can show your **custom install UI** (e.g. “Install app” button).
3. When the user taps “Install”, you call **`deferredPrompt.prompt()`**.
4. The browser shows its native install dialog (Add to Home Screen / Install app).
5. If the user accepts, the app is **installed** (icon on home screen / app drawer). When they open it, it runs in **standalone** mode (no browser address bar), using `start_url: "/"` from the manifest.

So: **your PWA works** by combining the **manifest** (install + appearance) and the **service worker** (caching + offline).

---

### 4. After install (opening the app)

1. User opens the app from the home screen icon.
2. Browser loads **index.html** (via `start_url`: `/`). Display is **standalone** (full screen, no browser UI).
3. Service worker is already registered from the first visit. It can:
   - Serve **precached** JS/CSS from cache (fast load).
   - For **HTML**, use **NetworkFirst** (try network first, fallback to cache if offline).
   - For **images**, use **CacheFirst** (serve from cache when available).
4. So the app **works** from cache when possible and stays reasonably up to date by preferring network for the document.

---

### 5. Updates (you deploy a new version)

1. You deploy new files to the server (new JS/CSS, new service worker).
2. When the user visits (or refreshes), the browser sees that the **service worker file** has changed.
3. A **new** service worker installs in the background.
4. Because you use **`registerType: "autoUpdate"`** with **`skipWaiting: true`** and **`clientsClaim: true`**:
   - The new service worker **activates immediately** (does not wait for all tabs to close).
   - It **takes control** of the page.
   - **Old caches** are cleaned up (`cleanupOutdatedCaches: true`).
5. The next time the user loads a page (or refreshes), they get the **new** app and new assets.

So **how it works** for updates: new SW replaces old SW automatically; users get the new version without manually clearing cache.

---

### 6. Summary flow diagram

```
Build (npm run build)
  → Vite builds app
  → vite-plugin-pwa generates SW + manifest
  → Injected code will register SW on load

First visit
  → HTML + JS load
  → SW registers → installs → precaches assets + sets runtime rules
  → App is installable (manifest + beforeinstallprompt)

User installs (optional)
  → Your UI calls deferredPrompt.prompt()
  → App added to home screen, opens in standalone

Later visits / reopen
  → SW serves cached assets when possible
  → HTML: network first (fresh), then cache if offline
  → Images/JS/CSS: from cache or network per strategy

New deployment
  → New SW + new assets on server
  → Browser installs new SW → auto-activates → old caches removed
  → User gets new version on next load/refresh
```

---

## Overview

The app can be:

- **Installed** on mobile and desktop (Add to Home Screen / Install app).
- **Used offline** for cached assets (JS, CSS, images).
- **Auto-updated** when a new version is deployed (service worker updates in background).

The PWA is configured in the **client** (Vite) project. The plugin generates a **service worker** and a **web app manifest** at build time.

---

## Tech Stack

| Package            | Purpose |
|--------------------|--------|
| `vite-plugin-pwa`  | Integrates PWA with Vite: generates service worker and manifest. |
| **Workbox** (used by the plugin) | Google’s libraries for service workers: precaching, runtime caching, strategies. |

- **Version in use:** `vite-plugin-pwa@^1.0.0`
- **Config file:** `client/vite.config.js`

---

## Configuration

Main PWA options are in **`client/vite.config.js`**:

```js
import { VitePWA } from "vite-plugin-pwa";

VitePWA({
  registerType: "autoUpdate",   // New SW takes over without user action
  filename: 'manifest.webmanifest',
  strategies: 'generateSW',     // Use Workbox GenerateSW
  injectRegister: 'auto',       // Auto-register the service worker
  includeAssets: ["vite.svg", "robots.txt", "logo.jpeg"],
  workbox: { /* ... */ },
  manifest: { /* ... */ },
  devOptions: {
    enabled: false,             // PWA disabled in dev by default
    type: 'module',
  },
})
```

| Option            | Value        | Meaning |
|-------------------|-------------|--------|
| `registerType`    | `"autoUpdate"` | New service worker activates and replaces the old one automatically. |
| `filename`        | `manifest.webmanifest` | Name of the generated manifest file. |
| `strategies`      | `'generateSW'` | Build a service worker with Workbox (no custom SW file). |
| `injectRegister` | `'auto'`    | Plugin injects the code that registers the service worker. |
| `includeAssets`   | Array       | Extra static files to be included in the precache. |

---

## Web App Manifest

The manifest defines how the app appears when installed (name, icons, theme, display mode).

- **Generated by the plugin** from the `manifest` option in `vite.config.js`.
- **Fallback/override:** `client/public/manifest.webmanifest` (optional; can be used for custom name/description/icons).

### Current manifest (from `vite.config.js`)

| Field             | Value        | Description |
|-------------------|-------------|-------------|
| `name`            | Gultraders  | Full app name. |
| `short_name`      | Gultraders  | Name under the icon. |
| `start_url`       | `/`         | URL opened when launching the app. |
| `display`         | `standalone`| Runs like a native app (no browser UI). |
| `background_color`| `#000000`   | Splash/background color. |
| `theme_color`     | `#000000`   | Status bar / browser chrome color. |
| `icons`           | See config  | Icons for install and home screen. |

Icons referenced:

- `maskable.png` (196×196) – any + maskable
- `logo.jpeg` (192×192) – any

Ensure these files exist in `client/public/` (or paths adjusted accordingly).

### Public manifest

`client/public/manifest.webmanifest` can override or extend the generated one (e.g. description, orientation, extra icons). The HTML links to the manifest:

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

---

## Service Worker & Caching

The plugin uses **Workbox** to generate a service worker with:

- **Precache:** Built assets matching `globPatterns` (JS, CSS, ico, png, svg, webmanifest, woff, woff2).  
  `index.html` is **not** precached (`navigateFallback: null` and document handling below).

- **Runtime caching:**

  | Pattern              | Strategy         | Cache name      | Notes |
  |----------------------|------------------|------------------|--------|
  | Document (HTML)      | NetworkFirst     | `pages-cache`    | 3s timeout; effectively avoids long-term HTML caching. |
  | Images (png, jpg, …) | CacheFirst      | `images-cache`   | 30 days, max 100 entries. |
  | JS/CSS (same origin) | StaleWhileRevalidate | `static-resources` | Serves cache, updates in background. |

- **Behavior:**
  - `skipWaiting: true` – new SW activates without waiting for all tabs to close.
  - `clientsClaim: true` – new SW controls open pages immediately.
  - `cleanupOutdatedCaches: true` – old caches are removed.

So: **HTML is always fetched from network first**; JS/CSS and images are cached for performance and light offline use.

---

## Install Prompt (Add to Home Screen)

The **beforeinstallprompt** flow is implemented in **`client/src/components/custom/BottomNavigation.jsx`**:

1. **Listen for `beforeinstallprompt`**  
   The browser fires this when the app is installable (HTTPS, valid manifest, etc.). The event is prevented from showing the default UI and stored in state (`deferredPrompt`).

2. **When to show the custom prompt**  
   - App is not already running in standalone (installed) mode.  
   - User has not previously dismissed the install prompt (checked via `localStorage.getItem('pwa-install-dismissed')`).

3. **User actions**  
   - **Install:** Call `deferredPrompt.prompt()`, then handle `userChoice`. On accept, hide the prompt and clear deferred prompt.  
   - **Dismiss:** Set `localStorage.setItem('pwa-install-dismissed', 'true')` and hide the prompt.

4. **Detection of already installed**  
   `window.matchMedia('(display-mode: standalone)').matches` or `window.navigator.standalone === true` (iOS) is used to hide the install prompt when the app is already installed.

Relevant keys:

- **Storage key:** `pwa-install-dismissed`  
  If set, the custom install banner is not shown again (until the key is removed).

---

## HTML Meta Tags

In **`client/index.html`** the following support PWA and mobile install:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#000000" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Gultraders" />
```

These improve:

- Theming (theme-color).
- “Add to Home Screen” and full-screen behavior on Android and iOS.

---

## Testing & Deployment

### Local build (production mode)

```bash
cd client
npm run build
npm run preview
```

- Service worker and manifest are generated under `dist/`.
- Test install prompt and caching over `https` (or `localhost` for Chrome).

### Enable PWA in development (optional)

In `vite.config.js`, under `devOptions`, set `enabled: true` to test service worker and manifest in dev. Default is `false`.

### Deployment

1. Deploy the **`client/dist`** output to your host (e.g. static hosting or same server as API).
2. Ensure the server:
   - Serves `manifest.webmanifest` with correct path.
   - Serves the app at the same origin as the API (or configure CORS and consider scope).
3. Use **HTTPS** in production (required for service worker and install prompt).

### Checking that PWA is active

- **Chrome DevTools → Application:**
  - **Manifest:** Check name, icons, start_url.
  - **Service Workers:** See registered SW and update flow.
  - **Cache Storage:** Inspect Workbox caches (e.g. `pages-cache`, `images-cache`, `static-resources`).

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Install button never appears | HTTPS; valid manifest; `beforeinstallprompt` fired (Chrome); user not in standalone; `pwa-install-dismissed` not set. |
| Old version after deploy | Hard refresh; close all tabs; in DevTools → Application → Service Workers use “Update” / “Unregister”. |
| Manifest 404 | Build output contains `manifest.webmanifest`; server serves it at `/manifest.webmanifest`. |
| Wrong icons/name | `vite.config.js` `manifest` object and/or `public/manifest.webmanifest`. |
| PWA not working in dev | `devOptions.enabled` is `true` if you want SW in dev. |

---

## File Reference

| File | Role |
|------|------|
| `client/vite.config.js` | PWA plugin config, Workbox options, manifest definition. |
| `client/public/manifest.webmanifest` | Optional static manifest (description, icons, etc.). |
| `client/index.html` | Manifest link, theme-color, Apple PWA meta tags. |
| `client/src/components/custom/BottomNavigation.jsx` | Install prompt logic and `pwa-install-dismissed` handling. |

For more on the plugin and Workbox:

- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (docs and options)
- [Workbox](https://developer.chrome.com/docs/workbox/) (caching and strategies)
