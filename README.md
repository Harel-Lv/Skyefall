# Skyfall

Mobile-first MVP for a Spyfall-inspired social deduction party game: everyone except one player shares the same secret location, and the outsider blends in until the timed discussion ends.

The app wires up rooms over **Firestore** — there is **no chat** and **no extra roles**.

## Prerequisites

- Node.js 20+ recommended
- A Firebase project with **Firestore** and **Anonymous Authentication** enabled

## Install

```bash
npm install
```

## Firebase setup

1. In the [Firebase console](https://console.firebase.google.com/), create or open a project.
2. Enable **Authentication → Anonymous** provider.
3. Enable **Firestore** (Production mode or Test mode initially).
4. From **Project settings → General → Your apps**, add a Web app and copy its config keys.
5. Duplicate `.env.example` as `.env` in the project root (`copy .env.example .env` on Windows CMD, or `.env.example` → `.env` manually).

Fill in:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Restart `npm run dev` after edits.

### Firestore rules

This MVP trusts the client UI to hide spy and location appropriately. Anyone with developer tools open can inspect `spyIds` and `location`. For prototyping you may use permissive rules (replace before you ship publicly):

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
      match /players/{pid} {
        allow read, write: if true;
      }
      match /votes/{vid} {
        allow read, write: if true;
      }
    }
  }
}
```

For production, constrain reads/writes per `request.auth.uid` or move secrets behind Cloud Functions.

## Run locally

```bash
npm run dev
```

Open the printed URL in several browsers or tabs to simulate multiplayer.

## Deploy to Vercel

1. Push the repo or import it into [Vercel](https://vercel.com/).
2. Confirm **Build Command** is `npm run build` and **Output Directory** is `dist` (often auto-detected for Vite).
3. Under **Project → Settings → Environment Variables**, add the same six `VITE_FIREBASE_*` keys as in your local `.env` (these are injected at **build time** on Vercel).
4. In **Firebase → Authentication → Settings → Authorized domains**, add your hostname only, e.g. `skyefall.vercel.app` (no `https://`).
5. Deploy. The included `vercel.json` rewires unknown paths to `/index.html` so deep links such as `/r/ABCDE` work after refreshing.

Lobby **Copy invite link** uses the current origin on Vercel. When developing on `localhost`, set `VITE_PUBLIC_APP_ORIGIN=https://YOUR-APP.vercel.app` in `.env` (no trailing slash) and restart `npm run dev` so copied links still point at production.

## Architecture notes

| Path | Responsibility |
| --- | --- |
| `src/firebase/config.ts` | Reads environment variables |
| `src/firebase/client.ts` | Initializes Firebase singletons |
| `src/firebase/roomService.ts` | Mutations plus realtime subscriptions |

Rooms cycle `lobby` → `playing` → `voting` → `ended`. When time is up, any client may move the room to `voting`. After every player records a vote in `votes/{voterId}`, the room moves to `ended` and the results screen scores the plurality.

The host can run **New round** to clear votes, pick a new location and spy, and restart the seven-minute timer.

**Join timing:** New players cannot join while a round is `playing` or `voting` (they would miss the spy/location assignment). Anyone already in `players/` can reopen the link anytime; reconnecting updates their display name only.
