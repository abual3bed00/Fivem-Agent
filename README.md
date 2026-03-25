# FiveM Script Agent

![Release](https://img.shields.io/github/v/release/abual3bed00/Fivem-Agent?label=release&style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge)
![Electron](https://img.shields.io/badge/built%20with-Electron-47848F?style=for-the-badge)
![FiveM](https://img.shields.io/badge/focus-FiveM-orange?style=for-the-badge)
![License](https://img.shields.io/github/license/abual3bed00/Fivem-Agent?style=for-the-badge)

FiveM Script Agent is a desktop app built to make FiveM resource development faster, cleaner, and easier. It combines a code editor, project explorer, ready-made templates, local AI tooling, and update support in one place so you can build FiveM scripts without jumping between too many tools.

## Overview

This project is designed for developers who work on:

- FiveM resources
- QBCore and ESX scripts
- NUI interfaces
- Lua, HTML, CSS, and JavaScript files
- AI-assisted script generation and editing

The app helps you create, edit, organize, and improve FiveM resources through a desktop workflow that feels closer to a lightweight game-dev IDE.

## Why This App Exists

FiveM development often means switching between editors, folders, templates, docs, and repeated boilerplate. This app aims to reduce that friction by giving you:

- A focused workspace for FiveM projects
- Fast file creation from templates
- Built-in resource editing tools
- Local AI assistance for reading and generating code
- Easier release and update flow through GitHub

## Main Features

- Desktop editor built with Electron
- Project explorer for browsing resource files
- Quick file actions for creating, renaming, moving, and deleting files
- Template generation for common FiveM files
- Support for Lua, HTML, CSS, JavaScript, Markdown, and SQL editing
- Local AI integration using `node-llama-cpp`
- Built-in project knowledge files for FiveM-related guidance
- GitHub-based app update support
- Windows installer generation with `electron-builder`

## Project Structure

- `main.js`: Electron main process and application logic
- `preload.js`: secure bridge between Electron and renderer
- `renderer/`: UI files for the application
- `templates/`: starter files used when creating new resources/files
- `knowledge/`: built-in reference material used by the app
- `assets/`: icons and visual assets
- `build/`: installer-related configuration
- `version.json`: app version metadata and GitHub update settings

## Installation

### Run Locally

```powershell
npm install
npm start
```

### Build Windows Installer

```powershell
npm run build
```

The generated installer will be created inside:

```text
dist/
```

## Updates

The app is prepared to check GitHub Releases directly. When a newer version is published to the repository releases page, the app can detect it, download the installer, and start the update flow.

Repository:
[https://github.com/abual3bed00/Fivem-Agent](https://github.com/abual3bed00/Fivem-Agent)

## Tech Stack

- Electron
- Node.js
- CodeMirror
- Axios
- Chokidar
- node-llama-cpp
- electron-builder

## Owner

Project owner:

- GitHub: [abual3bed00](https://github.com/abual3bed00)
- Developer name: ii_abual3bed

## License

This project is released under the MIT License.

See the full license in:
[LICENSE](LICENSE)
