# Caratsense — AI-Powered Jewelry Estimation Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/CSS-Vanilla-1572B6?style=flat-square&logo=css3" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

> A premium, ultra-minimalist B2B SaaS landing page for **Caratsense** — an AI-powered gemstone estimation platform. Inspired by the [antigravity.google](https://antigravity.google) aesthetic with a cursor-reactive dot field, multi-color particle system, interactive mock UIs, and a 3-mode theme system.

![Caratsense Hero](https://raw.githubusercontent.com/SahilShrivastava-Dev/Caratsense/master/src/assets/hero.png)

---

## ✨ Features

- **Cursor-Reactive Dot Field** — Full-page grid of particles that shift color by proximity: gold at the cursor core, blue in the mid-ring, neutral gray beyond, with smooth spring-physics repulsion
- **Radial Gradient Glow** — Smooth lerped spotlight that follows the cursor across every section
- **Interactive Mock UIs** — Click/hover the feature preview cards to reveal AI confidence scores, market comps, price-trend chart tooltips, and live exchange data
- **3-Mode Theme System** — Light (default), Dark, and an electric Invert/neon mode, toggled via a floating button
- **Scroll-to-Top FAB** — Appears after 15% scroll, smooth-scrolls back to top
- **Large-Monitor Responsive** — `clamp()`-based fluid typography, breakpoints at 1440px and 1920px
- **Zero external UI libraries** — Pure React + Vanilla CSS

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Minimum Version | Check |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | `node -v` |
| npm | v9+ | `npm -v` |
| Git | any | `git --version` |

### 1. Clone the repository

```bash
git clone https://github.com/SahilShrivastava-Dev/Caratsense.git
cd Caratsense
```

### 2. Install dependencies

```bash
npm install
```

> This installs React, Vite, and all dev dependencies. No external UI library is required.

### 3. Start the development server

```bash
npm run dev
```

The site will be live at **[http://localhost:5173](http://localhost:5173)** (or the next available port — check your terminal output).

The dev server supports **Hot Module Replacement (HMR)** — any changes you save are reflected instantly in the browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

Output is written to `dist/`. To preview the production build locally:

```bash
npm run preview
```

---

## 🗂️ Project Structure

```
Caratsense/
├── public/
│   ├── favicon.svg          # Gem icon favicon
│   └── icons.svg            # SVG sprite
├── src/
│   ├── App.jsx              # Main application — all sections + components
│   ├── index.css            # All styles (CSS variables, themes, responsive)
│   ├── main.jsx             # React entry point
│   └── assets/
│       └── hero.png         # Hero section asset
├── index.html
├── vite.config.js
└── package.json
```

---

## 🎨 Theme System

The bottom-left floating button cycles through three themes:

| Icon | Theme | Description |
|---|---|---|
| ☀️ | **Light** | Default — clean off-white, premium minimalist |
| 🌙 | **Dark** | Deep navy-black backgrounds, soft white text |
| ⚡ | **Invert** | Electric neon mode — high-contrast techy sharp palette |

Themes are applied via `data-theme` attribute on `<html>` and driven entirely by CSS custom properties — no JS color logic beyond toggling the attribute.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Vanilla CSS (CSS Variables, `clamp()`, `@media`) |
| Animation | `requestAnimationFrame` (dot field, glow lerp, starfield) |
| Interactivity | React `useState` + `useEffect` |
| Icons | Inline SVG |
| Fonts | System font stack + Google Fonts (Inter) |

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 📄 License

MIT — feel free to fork, adapt, and ship.

---

<p align="center">Built with ❤️ by <a href="https://github.com/SahilShrivastava-Dev">SahilShrivastava-Dev</a></p>
