# 🧮 Math Arena

> A competitive multiplayer math battle game for school and college students — powered by tug-of-war mechanics.

![Math Arena Banner](https://img.shields.io/badge/Math%20Arena-v2.0-00e676?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848f?style=for-the-badge&logo=electron)
![License](https://img.shields.io/badge/License-MIT-40c4ff?style=for-the-badge)

---

## 📖 What is Math Arena?

Math Arena is a **2-team competitive math game** where students race to answer math questions. Every correct answer pulls a virtual tug-of-war rope toward your side. The team that drags the rope past the opponent's boundary **wins the contest**.

It supports both **same-screen split play** and **multi-device play via QR code**, making it perfect for classrooms, labs, or college competitions.

---

## ✨ Features

### 🎬 Intro & Navigation
- **Animated loading splash** on first launch with progress bar and glowing logo
- **Landing screen** with two clear entry points: Quick Play or Custom Contest
- **Back / Quit buttons** on every screen — never get stuck
- **Pause overlay** with blur effect during gameplay

### 🏆 Gameplay
- **Tug-of-War mechanic** — correct answers pull the rope; first to cross the boundary wins
- **MCQ questions** — four options, tap to answer instantly
- **Subjective questions** — on-screen numeric keypad with SUBMIT button
- **25-second countdown** per question with animated ring timer
- **⏸ Pause / ▶ Resume** button to freeze the game at any moment
- **Live score tracking**, streaks 🔥, and round-by-round feedback
- **Confetti victory screen** with final rope position replay

### 🛠️ Admin Panel
- Add / edit / delete questions from a visual question bank
- Set **question type** (MCQ or Subjective), **difficulty** (Easy / Medium / Hard), and **category**
- Filter questions by difficulty level
- **15 sample questions** pre-loaded across multiple categories

### 🎮 Play Modes
| Mode | Description |
|------|-------------|
| **⚡ Quick Play** | Jump straight in using pre-loaded questions — no setup needed |
| **🛠️ Custom Contest** | Open Admin Panel to add your own questions, then start |
| **Same Screen** | Both teams play on one device — split-screen layout |
| **Multi-Device (QR)** | Each team scans a QR code to join from their own device |

### 🎨 Design
- Animated intro with star field, glow orbs, and gradient rope decoration
- Dark gaming aesthetic: deep navy `#060f1e` background
- Team colors: **Green** (Team 1) vs **Red** (Team 2), **Light Blue** accents
- Animated SVG stick figures, rope, knot, and arena
- Google Fonts: *Exo 2* + *JetBrains Mono*
- Pure SVG/CSS animations — no external game engine

---

## 📁 Project Structure

```
tug_of_math/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.jsx                        ← Main router (screen switcher)
│   │
│   ├── constants/
│   │   └── gameData.js                ← Colors, timing, default questions
│   │
│   ├── hooks/
│   │   └── useCSS.js                  ← All CSS keyframes & shared classes
│   │
│   └── components/
│       ├── IntroScreen.jsx            ← Animated splash + landing page
│       ├── AdminPanel.jsx             ← Question bank manager
│       ├── SetupScreen.jsx            ← Team names + play mode picker
│       ├── QRLobby.jsx                ← QR device connection lobby
│       ├── GameScreen.jsx             ← Main gameplay + pause/quit
│       ├── ResultScreen.jsx           ← Victory screen + confetti
│       ├── TugArena.jsx               ← SVG tug-of-war animation
│       ├── MCQPanel.jsx               ← Multiple choice answer panel
│       ├── SubjectivePanel.jsx        ← Numeric keypad + submit
│       └── QRCode.jsx                 ← QR code generator (SVG)
│
├── electron.js                        ← Electron desktop wrapper
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🖥️ Screen Flow

```
App Launch
    └── IntroScreen  (loading splash → landing)
            ├── ⚡ Quick Play ──────────► SetupScreen
            │                                 ├── Same Screen ──► GameScreen ──► ResultScreen
            │                                 └── QR Mode ──────► QRLobby ───► GameScreen ──► ResultScreen
            └── 🛠️ Custom Contest ──────► AdminPanel
                                              └── START CONTEST ──► SetupScreen  (same flow)
```

---

## ⚙️ Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ (LTS) | [nodejs.org](https://nodejs.org) |
| npm | v9+ (bundled with Node) | — |
| Git (optional) | Any | [git-scm.com](https://git-scm.com) |

---

## 🚀 Installation & Setup

### Step 1 — Create Vite + React Project

```bash
npm create vite@latest tug_of_math -- --template react
cd tug_of_math
npm install
```

### Step 2 — Replace the `src/` Folder

Delete everything inside `src/` and copy in the provided files following this exact layout:

```
src/
├── App.jsx
├── constants/gameData.js
├── hooks/useCSS.js
└── components/
    ├── IntroScreen.jsx
    ├── AdminPanel.jsx
    ├── SetupScreen.jsx
    ├── QRLobby.jsx
    ├── GameScreen.jsx
    ├── ResultScreen.jsx
    ├── TugArena.jsx
    ├── MCQPanel.jsx
    ├── SubjectivePanel.jsx
    └── QRCode.jsx
```

### Step 3 — Install Tailwind CSS (v3)

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

Replace `tailwind.config.js` with:

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Ensure `src/main.jsx` looks like:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

### Step 4 — Run the Game

```bash
npm run dev
```

Open **http://localhost:5173** in your browser ✅

---

## 🖥️ Build as Desktop App (.EXE)

### Step 5 — Install Electron

```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### Step 6 — Create `electron.js` in Project Root

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    title: 'Math Arena',
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: { nodeIntegration: false }
  });

  const startUrl = process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    });

  win.loadURL(startUrl);
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

> **Note:** Vite outputs to `dist/` — not `build/` like Create React App.

### Step 7 — Update `package.json`

Add these fields (keep your existing `dependencies`):

```json
{
  "main": "electron.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron": "electron .",
    "electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "dist": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.matharena.game",
    "productName": "Math Arena",
    "win": {
      "target": "nsis",
      "icon": "public/favicon.ico"
    },
    "files": [
      "dist/**/*",
      "electron.js",
      "node_modules/**/*"
    ]
  }
}
```

### Step 8 — Build the Installer

```bash
npm run dist
```

Your `.exe` installer appears in the **`dist_electron/`** folder 🎉

---

## 🧪 All Available Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Run in browser (development, hot reload) |
| `npm run build` | Build React app for production into `dist/` |
| `npm run electron` | Launch as desktop app (requires build first) |
| `npm run electron-dev` | Desktop app with live-reload dev mode |
| `npm run dist` | Build final `.exe` Windows installer |

---

## 🎮 How to Play

### Quick Play (no setup needed)
1. Open the app → animated splash loads → landing screen appears
2. Click **⚡ Quick Play**
3. Enter custom team names (or keep defaults)
4. Choose **Same Screen** or **Multi-Device**
5. Set number of questions → Click **Start Battle!**

### Custom Contest
1. Click **🛠️ Custom Contest** on the landing screen
2. Add math questions — set type, difficulty, category, and correct answer
3. Click **START CONTEST** when ready
4. Follow Setup screen to begin

### During the Game

| Action | How |
|--------|-----|
| Answer MCQ | Click any of the 4 option buttons on your side |
| Answer Subjective | Type using keypad → press **SUBMIT ✓** |
| Pause game | Press **⏸** button in the top centre |
| Resume game | Press **▶ Resume** on the pause overlay |
| Quit mid-game | Press **✕** header button or **🚪 Quit Game** on pause screen |
| Go back | Use **← Back** button available on every screen |

### Winning
- Every correct answer pulls the rope toward your team
- First team to drag the rope knot past their boundary line **wins**
- Wrong answers shake and reset — keep trying!
- If 25 seconds expire, the question is skipped with no point

---

## 📚 Question Categories

| Category | Example Topics |
|----------|---------------|
| Arithmetic | Multiplication, division, BODMAS |
| Algebra | Linear equations, factoring |
| Geometry | Area, angles, Pythagorean theorem |
| Calculus | Derivatives, integrals |
| Logarithms | Log rules, natural log |
| Trigonometry | sin, cos, tan values |
| Number Theory | Primes, LCM, HCF |
| Combinatorics | Factorials, permutations |
| Statistics | Mean, median, mode |

---

## 🤝 Multiplayer Modes Explained

### Same Screen Mode
Both teams sit at the same computer. The screen is split into a **left panel (Team 1)** and **right panel (Team 2)**. Each team uses their own side's buttons or keypad to answer simultaneously.

### Multi-Device Mode (QR)
1. Host opens the game on a main display
2. A lobby shows two QR codes — one per team
3. Each team scans their QR code on their own phone or laptop over the same WiFi
4. Players answer from their own device
5. Answers sync back to the main game screen in real time

> ℹ️ The current version simulates the QR connection flow. Full LAN networking with `socket.io` can be added for production deployment.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework and state management |
| Vite 5 | Fast dev server and production bundler |
| Tailwind CSS v3 | Utility-first styling base |
| SVG | All game graphics (rope, arena, stick figures) |
| CSS Animations | Intro splash, transitions, game effects |
| Electron | Desktop app wrapper |
| electron-builder | Packages app as Windows `.exe` installer |
| Google Fonts | *Exo 2* display font + *JetBrains Mono* |

---

## 📐 Component Reference

| Component | File | Responsibility |
|-----------|------|---------------|
| App | `App.jsx` | Screen router, global questions state |
| IntroScreen | `components/IntroScreen.jsx` | Loading splash + landing page with mode choice |
| AdminPanel | `components/AdminPanel.jsx` | Add / edit / delete question bank |
| SetupScreen | `components/SetupScreen.jsx` | Team names, play mode, question count |
| QRLobby | `components/QRLobby.jsx` | QR code display + device join simulation |
| GameScreen | `components/GameScreen.jsx` | Core gameplay, timer, pause/resume, quit |
| ResultScreen | `components/ResultScreen.jsx` | Winner announcement + confetti + replay |
| TugArena | `components/TugArena.jsx` | SVG tug-of-war rope and character animation |
| MCQPanel | `components/MCQPanel.jsx` | Multiple-choice option buttons per team |
| SubjectivePanel | `components/SubjectivePanel.jsx` | Numeric keypad + SUBMIT for typed answers |
| QRCode | `components/QRCode.jsx` | Pure SVG QR code generator (no library) |
| gameData | `constants/gameData.js` | Global constants, colors, 15 default questions |
| useCSS | `hooks/useCSS.js` | CSS injection, all keyframe animations, shared classes |

---

## 🐛 Troubleshooting

**Buttons are cut off or not visible**
→ Zoom out in browser with `Ctrl` + `-`. The layout targets 1280×800 or larger screens.

**`npx tailwindcss init -p` fails**
→ You must run `npm install -D tailwindcss@3 postcss autoprefixer` first, then run `init`.

**White screen on Electron launch**
→ Run `npm run build` before `npm run electron`. Electron loads from the `dist/` folder.

**`npm run dist` gives an icon error**
→ Add any `.ico` file at `public/favicon.ico`, or remove the `icon` field from `electron.js` and `package.json > build`.

**Pause doesn't stop the timer**
→ Ensure you are using the latest `GameScreen.jsx` — it uses `pausedRef` to correctly block the timer tick.

**QR codes don't connect on real devices**
→ The current version simulates the connection. For real LAN multiplayer, add a `socket.io` server and update `QRLobby.jsx` and `GameScreen.jsx` accordingly.

**Fonts not loading when offline**
→ Google Fonts are loaded via CDN. For offline use, download the font files and serve them locally from `public/fonts/`, then update the `@import` in `useCSS.js`.

---

## 🗺️ Roadmap / Future Ideas

- [ ] Real LAN multiplayer with `socket.io`
- [ ] Sound effects and background music
- [ ] Image-based questions (geometry diagrams)
- [ ] Persistent leaderboard with scores history
- [ ] Import questions from CSV / Excel file
- [ ] Teacher dashboard with per-student analytics
- [ ] Mobile responsive layout
- [ ] Timer difficulty scaling (hard questions get less time)

---

## 📄 License

MIT License — free for educational and personal use.

---

## 🙌 Credits

Built with React + Vite + Electron. Designed for students and educators who want to make math competitions exciting and interactive.

> *"Answer fast. Pull hard. Win the rope."* 🏆