#!/bin/bash
# Creates all MyShelf GitHub issues
# Usage: GITHUB_TOKEN=your_token bash create-issues.sh
# Or: gh auth login first, then bash create-issues.sh

REPO="Kanifu/Myshelf"

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
}

echo "Creating MyShelf GitHub issues..."

# --- Phase 1: v1 Polish ---

create_issue \
  "Bug: Library search bar doesn't filter books" \
  "The search input in the Library view exists but does not reactively filter the book list.\n\n**Fix:** Wire the \`searchQuery\` state to the filtered book computation in \`LibraryView.jsx\`." \
  "bug,p0"

create_issue \
  "Bug: DNF filter chip is clipped/cut off" \
  "The 'DNF' status chip is partially cut off in the horizontal filter row.\n\n**Fix:** Add \`overflow-x: auto\` and prevent wrapping on the filter container, or reduce chip padding." \
  "bug,p0"

create_issue \
  "Feature: Use recommendation feedback to improve next prompt" \
  "Rejected ('Not for Me') recommendations are stored in the DB but not injected into the next Claude prompt.\n\n**Fix:** In \`claudeService.js\`, load past rejected recommendations from Dexie and include them as a \`PREVIOUSLY_REJECTED\` section in the prompt." \
  "enhancement,p1"

create_issue \
  "Feature: Add onboarding flow for first-time users" \
  "New users land on an empty library with no guidance.\n\n**Spec:**\n1. Welcome screen (skippable)\n2. Quick genre selection\n3. Prompt to add first books\n4. After 5+ books: trigger first recommendation\n\nOnboarding should only show once, tracked in localStorage." \
  "enhancement,p1"

create_issue \
  "UX: Add loading + error states to Add Book search" \
  "Currently no feedback if the Google Books search is loading, fails, or returns no results.\n\n**Add:**\n- Spinner/skeleton while searching\n- 'No results found' empty state\n- Retry button on API error" \
  "enhancement,p1"

create_issue \
  "UX: Show book count and breakdown in Library header" \
  "Show more than just '0 books'. Add a quick stat line like '42 books · 28 read · 6 reading · 8 want to read'.\n\nComputed from the Zustand library store." \
  "enhancement,p1"

# --- Phase 2: Multi-modal Input ---

create_issue \
  "Feature: Voice input for adding books" \
  "Add a microphone button on the Add Book screen.\n\n**Implementation:**\n- Use Web Speech API (\`lang\` based on settings: \`nl-NL\` or \`en-GB\`)\n- Transcript → Claude parses intent → structured book query\n- Google Books lookup → confirmation screen\n\nExample: 'Add The Name of the Wind by Patrick Rothfuss'" \
  "enhancement,p2,v2"

create_issue \
  "Feature: Camera / photo book cover recognition" \
  "Add a camera button on Add Book screen.\n\n**Implementation:**\n- \`MediaDevices.getUserMedia\` to capture photo\n- Send image to Claude Vision API (claude-sonnet-4-6 with image content)\n- Claude returns \`{ title, author, confidence }\`\n- Auto-search Google Books → confirmation screen" \
  "enhancement,p2,v2"

create_issue \
  "Feature: Series bulk import" \
  "Add an 'Import series' option on Add Book.\n\n**Flow:**\n1. User types author + series name\n2. Fetch all volumes from Google Books / Open Library\n3. Show full list with covers + volume numbers + checkboxes\n4. User selects status (read/want to read) per book or in bulk\n5. Bulk add to library" \
  "enhancement,p2,v2"

create_issue \
  "Feature: ISBN barcode scan (stretch)" \
  "Camera mode that scans a barcode → extracts ISBN → Google Books lookup → confirmation.\n\n**Library:** ZXing-js or QuaggaJS for barcode decoding in browser." \
  "enhancement,p2,stretch"

# --- Phase 3: Series Explorer ---

create_issue \
  "Feature: Series view in Library" \
  "Add a 'Series' view mode that groups books by \`series.name\`.\n\n**Shows:**\n- Series name + author\n- Volume order\n- Progress bar (e.g. '3 of 5 read')\n- Gaps highlighted (missing volumes)" \
  "enhancement,p3,v3"

create_issue \
  "Feature: Series gap detection" \
  "When a series is in the library, fetch the full series from Open Library to find volumes the user doesn't have.\n\nSurface a prompt: 'Book 4 exists — want to add it?' inside the series view or book detail." \
  "enhancement,p3,v3"

create_issue \
  "Feature: 'Next in series' shortcut on book detail" \
  "On any BookDetailModal for a book in a series, show a 'Next: [Book N+1 title]' button.\n\nTapping it navigates directly to the Add Book confirmation screen pre-filled with that book." \
  "enhancement,p3,v3"

create_issue \
  "Feature: Discover new series (AI recommendations)" \
  "Add a 'Suggest a series' mode in the For You tab.\n\nClaude recommends full series (not individual books) based on completed series the user rated 4–5 stars. Each card shows the full series with vol count and reasoning." \
  "enhancement,p3,v3"

# --- Phase 4: Kobo ---

create_issue \
  "Feature: Kobo reading history CSV import" \
  "Add an import option in Settings that accepts the Kobo reading history CSV export.\n\n**Implementation:**\n- File picker for .csv\n- Parse with PapaParse\n- Map Kobo columns (Title, Author, DateFinished, etc.) to Book model\n- Bulk add with \`source: 'kobo_import'\` and \`status: 'read'\`" \
  "enhancement,p4,v4"

create_issue \
  "Feature: Kobo Plus badge on recommendation cards" \
  "Attempt to detect Kobo Plus availability.\n\n**Approach:** Fetch Kobo search result page HTML and parse for Plus badge markup. This is inherently fragile — always fall back gracefully to the plain search link. Mark clearly in code as 'fragile / may break'." \
  "enhancement,p4,v4,stretch"

# --- Phase 5: PWA & Polish ---

create_issue \
  "Feature: PWA manifest + service worker" \
  "Make MyShelf installable as a PWA.\n\n**Add:**\n- \`public/manifest.json\` with app name, icons, theme (#0f172a), display: standalone\n- Service worker via Vite PWA plugin (\`vite-plugin-pwa\`)\n- Offline fallback page\n- 'Add to Home Screen' prompt on mobile" \
  "enhancement,p2,v5"

create_issue \
  "Feature: Reading stats dashboard" \
  "Add a Stats tab or modal showing:\n- Books read per month (bar chart)\n- Genre breakdown (donut chart)\n- Average rating\n- Reading pace vs goal\n- Total pages read (from Google Books metadata)\n\n**Library:** Recharts or Chart.js (lightweight)" \
  "enhancement,p3,v5"

create_issue \
  "Feature: Export library as JSON and CSV" \
  "Add export buttons in Settings:\n- 'Export as JSON' → downloads \`myshelf-export.json\`\n- 'Export as CSV' → downloads \`myshelf-export.csv\`\n\nBoth should include all book fields. JSON export should be re-importable." \
  "enhancement,p3,v5"

create_issue \
  "Feature: Reading pace goal tracking" \
  "Allow user to set a books-per-month goal in Settings.\n\nShow progress in the Library header: e.g. 'May: 2 / 4 books' with a small progress bar." \
  "enhancement,p3,v5"

create_issue \
  "Feature: Recommendation history view" \
  "Add a 'History' section at the bottom of the For You tab.\n\nShows past recommendation batches (date, how many acted on, how many rejected). Expandable to see individual recommendations and their feedback." \
  "enhancement,p3,v5"

create_issue \
  "Chore: Deploy to Vercel" \
  "Set up production deployment on Vercel.\n\n**Steps:**\n1. Add \`vercel.json\` with SPA rewrite rules\n2. Document environment variable setup (note: API keys are currently stored client-side)\n3. Connect GitHub repo to Vercel for auto-deploy on push to \`main\`\n4. Configure custom domain if desired" \
  "chore,p2"

create_issue \
  "Feature: Light / dark theme toggle" \
  "Currently dark-only. Add a light theme and a toggle in Settings.\n\nUse Tailwind \`dark:\` classes + a class on \`<html>\` controlled by a preference in the Zustand preferences store." \
  "enhancement,p4"

echo ""
echo "Done! All issues created at https://github.com/$REPO/issues"
