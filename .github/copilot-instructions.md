# Copilot AI Coding Agent Instructions for `quest`

## Project Overview
- **Type:** Dynamic questionnaire web app (single-page, no build step)
- **Main UI/Logic:** `index.html` (HTML, JS, TailwindCSS, Chart.js)
- **Questionnaires:** Located in `quests/<name>/` (each with `questions.txt` and `config.yml`)
- **No backend/server**: All logic is client-side, fetches static files

## Key Components
- `index.html`: Contains all JavaScript for loading, rendering, evaluating, and charting questionnaires. No external JS files.
- `quests/`: Each subfolder (e.g. `autonomie`, `ace`) is a questionnaire with:
  - `questions.txt`: Pipe-separated lines (`<ID>|<Fragetext>`) for each question
  - `config.yml`: YAML with `title`, `description`, `answers`, `categories`, `chart`, and `input` options

## Data Flow
- On load, JS fetches `questions.txt` and `config.yml` for the selected questionnaire
- Questions and config are parsed in JS, then rendered as a table with radio buttons
- User answers are stored in the URL hash for persistence/sharing
- On submit, results are evaluated and shown as a chart (radar/bar/gauge via Chart.js)

## Patterns & Conventions
- **Dynamic menu**: Top menu is generated from available folders in `quests/`
- **YAML parsing**: Custom JS parser in `index.html` (not a library)
- **Answer mapping**: `answers` in YAML define both label and value (e.g. `- Ja: 1`)
- **Categories**: Each question's ID prefix (e.g. `A1`) maps to a category in YAML
- **Chart type**: Controlled by `chart.type` in YAML (`radar`, `bar`, `gauge`)
- **No build/test scripts**: All development is direct file editing; reload browser to test

## Examples
- To add a new questionnaire: create a new folder in `quests/` with `questions.txt` and `config.yml`
- To change answer options or chart type: edit the relevant `config.yml`
- To change UI logic: edit JS in `index.html` (all logic is inline)

## External Dependencies
- [TailwindCSS](https://cdn.tailwindcss.com) (CDN)
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (CDN)
- [Google Fonts: Inter](https://fonts.googleapis.com/css2?family=Inter)

## Project-Specific Advice
- Do not add a build step or server logic
- Keep all questionnaire logic in `index.html` (no splitting into modules)
- When adding config options, update both the YAML parser and the render logic
- Use only static file fetches for data (no dynamic API calls)
- Maintain compatibility with existing YAML/question formats

## Key Files/Dirs
- `index.html` — main app logic, UI, and data flow
- `quests/` — all questionnaire data
- Example: `quests/autonomie/config.yml`, `quests/autonomie/questions.txt`

---
For more, see the top of `index.html` and example configs in `quests/`.
