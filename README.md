# Todo Tracker

A local web app for personal to-dos with hourly (or custom-interval) sound reminders while the tab is open. Data stays in your browser’s `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Features

- Add, edit, complete, and delete tasks
- Filter: All / Active / Done
- Persist todos and reminder settings in `localStorage`
- Reminders while the tab is open: sound beep + optional browser notifications
- Interval: 15 / 30 / 60 minutes
- Test reminder button

Keep the tab open for reminders to fire. Closing the browser stops them.
