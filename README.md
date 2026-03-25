# FiveM Script Agent

<p align="center">
  <img src="https://img.shields.io/github/v/release/abual3bed00/Fivem-Agent?style=for-the-badge&logo=github&label=Release" alt="Release" />
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Built%20With-Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Focus-FiveM-F57C00?style=for-the-badge&logo=rockstargames&logoColor=white" alt="FiveM" />
  <img src="https://img.shields.io/github/license/abual3bed00/Fivem-Agent?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="License" />
</p>

FiveM Script Agent is a desktop app built to help FiveM developers create, edit, organize, and improve resources faster with a focused editor, file tools, templates, and AI-assisted workflows.

---

## العربية

### ما هو المشروع؟

**FiveM Script Agent** هو تطبيق سطح مكتب مخصص لتطوير سكربتات وموارد FiveM بطريقة أسرع وأسهل وأكثر تنظيمًا.  
فكرة التطبيق أنه يجمع لك أهم الأدوات في مكان واحد بدل ما تتنقل بين أكثر من محرر ومجلد وأداة خارجية.

### ما فائدته؟

هذا التطبيق يفيدك إذا كنت تعمل على:

- سكربتات FiveM
- مشاريع `QBCore`
- مشاريع `ESX`
- واجهات `NUI`
- ملفات `Lua`
- ملفات `HTML / CSS / JavaScript`
- إنشاء أو تعديل موارد كاملة بسرعة

### ماذا يقدم لك؟

- محرر ملفات داخل التطبيق
- مستعرض ملفات للمشروع
- إنشاء ملفات جديدة بسرعة
- قوالب جاهزة لملفات FiveM الشائعة
- تنظيم أفضل لمجلدات المشروع
- مساعدة ذكية مبنية على AI
- دعم للتحديثات من GitHub Releases
- بناء ملف تثبيت ويندوز للتطبيق

### لماذا تم إنشاء هذا التطبيق؟

لأن تطوير FiveM غالبًا يكون فيه تكرار كثير:

- إنشاء نفس الملفات كل مرة
- التنقل بين المحرر والمجلدات والمتصفح
- البحث عن أمثلة جاهزة
- إعادة كتابة boilerplate بشكل متكرر

هذا المشروع يحاول يقلل هذا التعب ويعطيك بيئة أخف وأسرع لتطوير الموارد والسكربتات.

### لمن هذا المشروع؟

المشروع مناسب لـ:

- مطوري FiveM المبتدئين
- مطوري السيرفرات الخاصة
- من يعمل على `QBCore` أو `ESX`
- من يريد أداة محلية تساعده في كتابة السكربتات وإدارة الملفات

### صاحب المشروع

- المالك: **ii_abual3bed**
- GitHub: [abual3bed00](https://github.com/abual3bed00)

---

## Overview

FiveM Script Agent is designed for developers who want a lightweight desktop workspace for FiveM development with practical editing tools and integrated AI assistance.

### Main Features

- Desktop editor built with Electron
- Project explorer for browsing resource files
- Quick file actions for creating, renaming, moving, and deleting files
- Template generation for common FiveM files
- Support for Lua, HTML, CSS, JavaScript, Markdown, and SQL editing
- Local AI integration using `node-llama-cpp`
- Built-in project knowledge files for FiveM-related guidance
- GitHub-based app update support
- Windows installer generation with `electron-builder`

### Project Structure

- `main.js`: Electron main process and core application logic
- `preload.js`: secure bridge between Electron and renderer
- `renderer/`: UI files and client-side behavior
- `templates/`: starter files used to generate new project files
- `knowledge/`: built-in reference content used by the app
- `assets/`: icons and visual assets
- `build/`: installer-related configuration
- `version.json`: app version metadata and GitHub update configuration

### Installation

#### Run Locally

```powershell
npm install
npm start
```

#### Build Windows Installer

```powershell
npm run build
```

The generated installer will be available in:

```text
dist/
```

### Updates

The app is prepared to check GitHub Releases directly. When a newer version is published, the application can detect it, download the installer, and start the update flow.

Repository:
[abual3bed00/Fivem-Agent](https://github.com/abual3bed00/Fivem-Agent)

### Tech Stack

- Electron
- Node.js
- CodeMirror
- Axios
- Chokidar
- node-llama-cpp
- electron-builder

## License

This project is released under the MIT License.

See the full license in:
[LICENSE](LICENSE)
