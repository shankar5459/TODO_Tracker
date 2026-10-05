# TODO Tracker

A local web app for everyday to-dos, priorities, and long-term completion history. Data stays in your browser’s `localStorage` on this device.

Tracks your daily list of tasks with reminder settings, notifications, and history.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Features

- **Today** list only: unfinished tasks from earlier days roll into today automatically
- Older completed tasks leave Today and stay in **History** by date
- Priority: High / Medium / Low
- Filter: All / Active / Done
- History search + date picker / day chips to jump to a specific day
- Archive done tasks from Today without losing them in History
- Persist todos, history, and reminder settings in `localStorage`
- Reminders while the tab is open: sound, browser notifications (unique alert each time), and an in-app banner
- Interval: 15 / 30 / 60 minutes
- Test reminder button

## Storage notes

Everything is saved in the browser on this laptop (`localStorage`). That is enough for years of personal task history. Clearing site data for this origin will erase todos and history. No sync across devices in this version.

Keep the tab open for reminders to fire. Closing the browser stops them.
