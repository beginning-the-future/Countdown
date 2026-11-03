# TIME — Google login setup

The code is prepared, but Google login is NOT active until you complete this setup.
The original TIME design, intro, fullscreen countdowns and backup tools remain.

## 1. Create your Firebase project
1. Open https://console.firebase.google.com/ and create a project, e.g. TIME.
2. Register a Web app using the </> option. App nickname: TIME Web.
3. Copy the Firebase configuration object from Project settings > General > Your apps.
4. Open firebase-config.js in VS Code or Notepad. Fill in apiKey, authDomain,
   projectId and appId with your project's exact values. Additional Firebase web
   config fields may be included. Keep `window.TIME_FIREBASE_CONFIG =` around the object.
   These are public web configuration values. Never use a service-account JSON,
   private key, OAuth client secret, or Google password in website code.

## 2. Enable Google login
1. Open Build > Authentication > Get started.
2. Open Sign-in method, choose Google, enable it, select your support email and save.
3. Under Authentication > Settings > Authorized domains, add the website hostname.
   Example for GitHub Pages: beginning-the-future.github.io
   Do not include https:// or a repository path.
4. For local testing, add localhost explicitly if it is not already present.

## 3. Create the private database
1. Open Build > Firestore Database > Create database.
2. Use the default database, Standard edition, and select a suitable region.
3. Start in production mode.
4. Open its Rules tab, replace the rules with the entire contents of firestore.rules,
   then click Publish.
5. Never enable public read/write to fix an error. The supplied rules allow each
   signed-in account to access only users/{its own Firebase UID}/countdowns.

## 4. Run the website
Google sign-in needs localhost or an HTTPS website. Do not double-click index.html.

With Python installed, open a terminal INSIDE the TIME folder and run:

    python -m http.server 8000

On Windows, if `python` is unavailable, try:

    py -m http.server 8000

Open http://localhost:8000 in Chrome. Alternatively use VS Code Live Server and
its localhost URL, or upload the website files to your HTTPS hosting provider.

Public website files: index.html, styles.css, app.js, auth.js, firebase-config.js,
and the assets folder. Do NOT upload your personal countdown backup JSON to public
hosting. It is retained in this ZIP only so you can import it privately.
The firestore.rules file must be published in Firebase; hosting it alone does nothing.

## 5. Restore your existing countdowns
1. Click Continue with Google and select your Google account.
2. Wait for the private timeline to load.
3. Click IMPORT BACKUP and choose your TIME-countdowns-2026-11-03.json file.
4. Import once: each import creates new countdowns with new IDs.
5. Existing localStorage data is left untouched, but is no longer displayed by this
   account-based version. Export it from your previous version if needed.

## What users get
- Google account login (including Gmail accounts); no Gmail inbox access requested.
- Their own countdowns, synced across devices when signed in to the same account.
- Add, edit, delete, export and import (up to 400 countdowns per import).
- Sign out clears the displayed countdowns and closes open editors/fullscreen view.
- Session-only login persistence: closing the browser session requires sign-in again.
- Cloud writes must finish before a success message is shown. Leave the page open
  until saving finishes. Offline edits are not offered; losing the connection during
  a save can leave it pending until the connection returns.
- Concurrent changes to different countdowns are independent. Concurrent edits to
  the SAME countdown use last-write-wins.

## Verify before sharing
1. Sign in with account A, create a countdown, refresh: it should remain.
2. Open a separate browser profile with account B: A's countdown must not appear.
3. Create B's countdown; sign out and back into A: only A's list should appear.
4. Sign into A on your phone: A's countdown should appear there too.
5. Test editing, deletion, import/export, cancelled popup and a failed network request.
6. In Firestore Rules Playground, test a read/write under users/A/countdowns/test:
   unauthenticated access must fail; authenticated UID B must fail; UID A with valid
   fields must succeed. Invalid fields must fail even for A.

Code syntax and mocked account/storage flows were checked during preparation.
Real Google OAuth, Firestore rules enforcement and cross-device sync still require
validation against your configured Firebase project. No live project was connected.

Troubleshooting:
- unauthorized-domain: add the exact hostname under Authorized domains.
- operation-not-allowed: enable Google authentication.
- permission-denied: create the database and publish firestore.rules.
- popup-blocked: allow popups and click Continue with Google again.
- setup required: fill in all four configuration fields.
- network/CDN error: check internet access and retry by refreshing.

Official references:
https://firebase.google.com/docs/auth/web/google-signin
https://firebase.google.com/docs/firestore/security/rules-conditions
https://firebase.google.com/docs/web/alt-setup
