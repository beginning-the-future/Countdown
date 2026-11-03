# Google account edition

Start with **GOOGLE-LOGIN-SETUP.md**. This edition uses Google login and Firestore instead of local browser storage. The older instructions below describe the original offline edition and do not apply to login or storage in this version.

---

# TIME — Every Second Matters

A personal cinematic countdown website, made for your upcoming exams, goals and milestones.

## Open TIME on Windows (recommended)

1. Download the **TIME-standalone.html** file supplied alongside the ZIP.
2. Open your **Downloads** folder in File Explorer.
3. Right-click `TIME-standalone.html` → **Open with** → **Google Chrome** (or Microsoft Edge).
4. Watch the five F1 starting lights go out, or choose **SKIP INTRO**.
5. Choose **NEW COUNTDOWN**, add your event name and its future date/time, then choose **CREATE COUNTDOWN**.

That single HTML file includes all three styled images, the animation, and the website code. You don't need to install anything or run a server. Internet is optional; online fonts enhance the appearance, but offline fallbacks are included.

## Or use the editable project ZIP

1. Download and extract `TIME-Website.zip` using **Extract All**.
2. Open the extracted `TIME` folder.
3. Double-click `index.html`, or right-click it → **Open with** → **Google Chrome**.
4. Keep `index.html`, `styles.css`, `app.js` and `assets/` together. If you move the website, move the whole folder.

The editable project contains:

```
TIME/
  index.html
  styles.css
  app.js
  assets/
    f1-hero.webp
    timeline-texture.webp
    krishna-cosmos.webp
  README.md
```

## Controls

- **NEW COUNTDOWN / CREATE NEW:** Add a clock with its own name and target date/time.
- **Pencil icon:** Edit the name or target date/time of an existing clock.
- **Trash icon (top right):** Delete a clock; confirmation is required.
- **Double-click a clock:** Open its immersive Krishna/cosmos countdown and request actual browser fullscreen.
- **ENTER / fullscreen icon:** Open a clock without double-clicking (also works on touchscreens).
- **EXIT COUNTDOWN or ESC:** Return to the dashboard.
- **EXPORT BACKUP:** Download your clocks as a `.json` file.
- **IMPORT BACKUP:** Restore clocks from a previous TIME backup (import merges with existing clocks).
- **SKIP INTRO:** Jump past the racing introduction.
- **Move the mouse:** Change the viewpoint of the 3D cosmic timeline and the full-screen starfield.

## How your countdowns are saved

TIME uses **your browser's localStorage**, with no accounts or backend. Saved countdowns remain when you close and reopen the website in the **same browser and at the same file location/site address**. The actual dates are saved as timestamps so the clocks continue counting correctly even when the page is closed.

**Important:** Clearing browser site data, using private/incognito mode, switching browsers, or relocating/renaming the HTML file can make saved clocks disappear. To protect them, periodically use **EXPORT BACKUP** and keep that file somewhere safe. This version does not sync clocks across devices.

## Design notes

- F1 / Red Bull–inspired cinematic opening based on your supplied Max Verstappen image, complete with starting lights, race-progress car and your supplied motivational quote.
- Interactive blue sacred-timeline-style astronomy dashboard using an animated perspective starfield, energized timeline strands, branching cosmic rays and mouse parallax.
- Immersive divine-cosmos countdown using a transformed crop of your supplied Krishna image, layered nebula glow, golden orbits and spatial starfield.
- Responsive desktop/mobile layouts and motion-reduction support.
- No J.A.R.V.I.S. or Tony Stark naming anywhere in the site.

This is a personal fan-inspired design, not an official Red Bull, Formula 1, Marvel or broadcaster product.
