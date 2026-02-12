# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chinese-language documentation site about autonomous driving technology (自动驾驶技术指南). Built with MkDocs and the Material theme, deployed to GitHub Pages via GitHub Actions.

- **Site URL:** https://yfrobotics.github.io/self-driving-handbook-cn
- **License:** CC 4.0-BY-SA
- **Language:** All content is in Simplified Chinese (zh)

## Build Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Serve locally with live reload (primary dev command)
mkdocs serve

# Build static site to site/ directory
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy
```

## Architecture

This is a pure documentation project — no application code, tests, or linting.

**Content structure** (`docs/`):
- `index.md` — Home page
- `intro/` — Section 1: Overview and definitions of autonomous driving
- `system/` — Section 2: Vehicle systems, V2X, platforms, safety, regulations
- `hardware/` — Section 3: CCU, drive-by-wire, sensors, cameras
- `algorithm/` — Section 4: Image/laser processing, localization, path planning, decision making, NLP
- `casestudy/` — Section 5: Real-world examples (Apollo)

**Navigation** is defined explicitly in `mkdocs.yml` under the `nav` key. Adding a new page requires updating both the markdown file and the nav config.

**Math support:** MathJax 3 is loaded via CDN. Use `$...$` for inline math and `$$...$$` for display math. Configuration is in `docs/_static/js/mathjaxhelper.js`.

**Markdown extensions:** `admonition`, `pymdownx.arithmatex`, `pymdownx.superfences`, `tables`, `fenced_code`.

## CI/CD

GitHub Actions (`.github/workflows/main.yml`) runs on push/PR to `master`: installs mkdocs-material, then deploys with `mkdocs gh-deploy`.
