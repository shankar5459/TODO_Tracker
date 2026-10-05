# TODO Tracker

A local-first web app for everyday to-dos, priorities, and long-term completion history — with **Google sign-in**, **Firebase Firestore** sync, and hosting on **GitHub Pages**.

**Live app:** https://shankar5459.github.io/TODO_Tracker/

Tracks your daily list of tasks with reminder settings, notifications, and history. Data survives clearing browser cache because it lives in Firestore under your Google account.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/TODO_Tracker/`).

## Features

- **Google sign-in** — each person gets their own cloud data
- **Today** list: unfinished tasks from earlier days roll into today
- Older completed tasks stay in **History** by date (search + day picker)
- Priority: High / Medium / Low
- Reminders while the tab is open: sound, browser notifications, in-app banner
- One-time **localStorage → cloud** migration on first sign-in
- Sync status chip: Synced / Syncing / Offline / Error

## Firebase

Reuses the same Firebase project as [kids-pocket-bank](https://github.com/shankar5459/kids-pocket-bank) (`piggy-pal-13cc2`), with a separate per-user path:

```
users/{uid}/todos/{todoId}
users/{uid}/history/{entryId}
users/{uid}/meta/settings
users/{uid}/meta/migration
```

Piggy Pal `families` / `inviteCodes` data is unchanged. Publish rules from [`firestore.rules`](firestore.rules) in Firebase Console (merge/replace so both apps’ rules are present).

### One-time Firebase Console setup

1. Authentication → Sign-in method → enable **Google**
2. Authentication → Settings → Authorized domains → `localhost`, `shankar5459.github.io`
3. Firestore → Rules → publish contents of `firestore.rules`

## GitHub Pages

- Vite `base` is `/TODO_Tracker/`
- Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys on push to `main`
- Repo Settings → Pages → Source: **GitHub Actions**

## Storage notes

- Cloud Firestore is the source of truth after sign-in
- Clearing site data does **not** delete cloud history (sign in again to reload)
- No server of your own — static files on GitHub Pages + Firebase

## License

MIT — see [LICENSE](LICENSE).
