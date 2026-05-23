# MyShelf

Personal book library and discovery app for tracking reading history, finding the next book, and keeping the data local.

## What Is Built

- Local library stored in IndexedDB with Dexie.
- Add books through Google Books search, manual confirmation, optional rating, and series metadata.
- Voice-to-search support in browsers with `SpeechRecognition` or `webkitSpeechRecognition`.
- First-run onboarding for preferred language and genres.
- Library grid and list views with status filters and title/author search.
- Book detail editing for status, rating, notes, tags, series name, and volume.
- Series explorer with reading progress and Kobo search shortcuts.
- Series bulk import using Google Books with Open Library fallback.
- Claude-powered recommendations with positive, negative, DNF, current, and want-to-read signals.
- Persistent recommendation history, feedback loop signals, and quick actions to add a recommendation to the shelf.
- Kobo search links for books and recommendations.
- Settings for Claude API key, optional Google Books API key, preferred genres, language, Kobo Plus, reading pace, JSON export, CSV export, and JSON/Kobo CSV import.
- Basic PWA manifest metadata for installable app behavior.

## Current Scope

This is a browser-only v1. Data and API keys stay on the current device:

- Books and recommendations: IndexedDB.
- Preferences and API keys: `localStorage`.
- No backend or sync yet.

Camera cover recognition, barcode scan, robust Kobo Plus detection, and deeper series metadata cleanup are planned follow-ups.

## Setup

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## API Keys

Google Books search works without a key, but a key can improve quota. Claude recommendations require an Anthropic API key entered in Settings.

You can override the Claude model at build time:

```bash
VITE_CLAUDE_MODEL=claude-sonnet-4-20250514 npm run dev
```

## Data Import

Settings accepts:

- MyShelf JSON export.
- CSV exports with columns such as `Title`, `Author`, `ISBN`, and `DateFinished`.
- Kobo-style CSV exports; imported books default to `read` unless a status column is present.

## Roadmap

1. Add camera/photo cover recognition through Claude Vision.
2. Add ISBN barcode scanning.
3. Add stronger Open Library metadata enrichment for exact series order and completeness.
4. Add optional Kobo Plus page detection with graceful fallback.
5. Add optional backend or Supabase sync for multi-device use.
