# Job Application Tracker (Phase 0)

Chrome-first (Firefox next) extension that logs job applications into your own Google Sheet.
Phase 0 = project scaffold, Google sign-in, tracker-sheet creation, tests.

## Run it

    npm install
    cp .env.example .env        # then set WXT_GOOGLE_CLIENT_ID
    npm run dev                 # opens Chrome with the extension loaded
    npm test                    # unit tests
    npm run build               # Chrome  -> .output/chrome-mv3
    npm run build:firefox       # Firefox -> .output/firefox-mv2

## Google Cloud setup (once)

1. Create a project at console.cloud.google.com and enable the **Google Sheets API**.
2. OAuth consent screen: User type **External**, status **Testing**. Add your email (and friends') as **test users**.
3. Credentials -> Create credentials -> OAuth client ID -> type **Web application**.
4. Open the extension popup -> "Setup info" and copy the redirect URI shown
   (looks like `https://<extension-id>.chromiumapp.org/`). Add it under **Authorized redirect URIs**.
5. Put the client ID in `.env` as `WXT_GOOGLE_CLIENT_ID`, restart `npm run dev`.

### Keeping the redirect URI stable
An unpacked extension's ID can change between machines. To pin it, generate a key
(Chrome docs: "Keep a consistent extension ID") and add `key` to the manifest in `wxt.config.ts`.
Firefox uses the fixed add-on ID in `wxt.config.ts` (change `job-tracker@example.com` to your own).

## Sheet layout

- **Applications**: 20 columns (ID hidden). `Days since applied` and `Flag` are per-row formulas.
- **Events**: log of every stage change (filled from Phase 2).
- **Settings**: `B1` follow-up days (7), `B2` ghosted days (21), `B3` stale days (30), `B4` schema version.
  Edit B1-B3 to tune the flags.

Column order is a contract (`src/lib/schema.ts`). Don't reorder without bumping `SCHEMA_VERSION`.

## Not yet verified (please test and report)

- The live Google calls (`createTracker`, `addApplication`) are written against the Sheets v4 docs but
  have **not** been run against a real account yet.
- OAuth uses the implicit flow (`response_type=token`) via `launchWebAuthFlow`. Tokens last ~1 hour
  and there is no refresh token. If Google rejects this for your client, we switch to auth-code + PKCE
  (probably with a tiny token-exchange backend).
- `drive.file` only sees sheets the extension created, so the sheet ID is remembered in extension storage.

## Next: Phase 1
One-click capture from job pages (JSON-LD -> per-site adapters -> URL rules -> confirm form).
