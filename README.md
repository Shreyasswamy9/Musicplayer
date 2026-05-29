# Cass Player

A pixel-art macOS desktop music player built with Electron, Vite, and React.

## Features

- Pixel-art UI with animated record player, spinning vinyl, and needle
- Record swap animation on song change (pink/blue vinyl alternation)
- Interactive progress bar with draggable star indicator
- Marquee scrolling for long track titles
- Pink and blue theme switching with persistent preference
- YouTube playlists — paste any public playlist URL (no sign-in) or sign in with Google to browse your own
- Local MP3 playback
- Custom frameless window with drag and resize
- Dynamic dock/taskbar icon that matches the active theme

## Getting Started
You only need 4 commands. Copy them one at a time:

```bash
# 1. Download the code
git clone https://github.com/cupidbity/cupid-music-player.git

# 2. Step INTO the folder you just downloaded (this step is required!)
cd cupid-music-player

# 3. Install dependencies (also auto-downloads the yt-dlp binary into ./bin)
npm install

# 4. Run the app in dev mode
npm run dev
```


### Prerequisites

Before the commands above will work, you need these installed:

| Tool | Why | Install link |
|------|-----|--------------|
| **Node.js 18 or newer** | Runs `npm` and the app's build tools | [nodejs.org](https://nodejs.org/) — download the LTS version |
| **Git** | Used by the `git clone` command above | [git-scm.com](https://git-scm.com/downloads) — usually pre-installed on macOS/Linux |

To check if you already have them, run:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x or higher
git --version     # should print git version 2.x.x
```

If any of those says "command not found," install that tool first.

> No Python is needed. The `npm install` step automatically downloads a standalone `yt-dlp` binary for your OS into the project's `bin/` folder.

---


## Adding Local Audio Files

The local playlist is driven by a single file, `playlist.json`, that lives next to your audio files. Drop your songs into the audio folder, list them in the JSON, and the player picks them up.

### Where the audio folder lives

- **Running from source (dev):** `audio/` in the project root.
- **Installed app (macOS):** `~/Library/Application Support/Cass Player/audio/`
- **Installed app (Windows):** `%APPDATA%\\Cass Player\\audio\\`
- **Installed app (Linux):** `~/.config/Cass Player/audio/`

On first launch, the installed app seeds this folder with the bundled defaults. After that it's yours to edit — the app never overwrites it.

### Building your playlist

1. Drop `.mp3` files into the audio folder.
2. Open `playlist.json` in the same folder and add one entry per song:

   ```json
   [
     { "file": "my-song.mp3", "title": "My Song", "artist": "Some Artist", "album": "Album Name", "art": "https://example.com/cover.jpg" },
     { "file": "another.mp3", "title": "Another Song", "artist": "Someone Else" }
   ]
   ```

   - `file` and `title` are required.
   - `artist`, `album`, and `art` are optional. `art` is a URL to a cover image.
   - The `file` value must match the mp3 filename exactly (spaces and case included).

3. In the app, hit the settings icon and the local tab is selected by default. Reload the app to pick up new edits — `playlist.json` is read on launch.

### Supported formats

`.mp3`, `.m4a`, `.aac`, `.flac`, `.wav`, `.ogg`, `.opus`.

## YouTube Setup

Two flows — pick whichever you want by configuring (or not) your `.env`. **No YouTube Premium / no subscription required** in either case.

**Paste any public playlist URL** (zero setup):

1. Click the settings icon in the player > switch to youtube
2. Paste a YouTube/YouTube Music playlist URL into the box
3. Hit `load playlist`

**Browse your own playlists** (requires Google OAuth setup):

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com/), enable **YouTube Data API v3**
2. Configure the OAuth consent screen (External, add yourself as a test user, scope `youtube.readonly`)
3. Create OAuth credentials of type **Desktop app**
4. Add `VITE_YOUTUBE_CLIENT_ID` and `VITE_YOUTUBE_CLIENT_SECRET` to your `.env`
5. Click the settings icon > switch to youtube > log in with google

The sign-in option only appears when `VITE_YOUTUBE_CLIENT_ID` is set; otherwise the URL-paste box shows instead.

See [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) for detailed instructions and troubleshooting.

## Build

```bash
npm run package
```

### Install as Desktop App

**macOS:**

`npm run package` creates installable mac artifacts in `out/`, including a `.dmg` for easy drag-and-drop install and a `.zip` for sharing.

Open the DMG, drag **Cass Player** into **Applications**, then launch it from Launchpad or Applications.

```bash
open "out/Cass Player-0.0.0-mac-arm64.dmg"
```

> Note: the macOS build is unsigned. On first launch you may need to right-click > Open, or go to System Settings > Privacy & Security to allow it.
>
> If you want a truly frictionless download for other people, the next step is Apple signing and notarization before distributing the DMG.

## Tech Stack

- **Electron** — desktop app shell (frameless window, IPC, system tray)
- **Vite** — build tool and dev server
- **React** — UI framework
- **HTML5 Audio** — local MP3 playback
- **yt-dlp** — YouTube audio streaming and public playlist extraction via `--flat-playlist`
- **YouTube Data API v3** — sign-in browsing of the user's own playlists (Google OAuth PKCE, free quota)
- **CSS** — custom properties for theming, calc-based responsive scaling
- **Node.js** — main process (yt-dlp execution)
