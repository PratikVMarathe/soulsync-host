# SoulSync Host

The host app is the primary shell for SoulSync.

It owns:

- public landing page
- Firebase auth resolution
- user dashboard
- user profile
- quiz library
- route-level loading of the admin and quiz remotes

## Default Port

`5000`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_AUTH_FLOW=popup
VITE_ADMIN_REMOTE_URL=http://localhost:5002/assets/remoteEntry.js
VITE_QUIZ_REMOTE_URL=http://localhost:5001/assets/remoteEntry.js
VITE_DEV_PORT=5000
VITE_PREVIEW_PORT=5000
```

## Key Responsibilities

- route unauthenticated users to the landing page
- route `USER` to the host dashboard
- route `ADMIN` and `SUPER_ADMIN` to `/admin/`
- embed the quiz widget on `/quiz/:quizId`
- surface graceful fallback UI when remotes are unavailable

## Important Files

- `src/App.jsx`
- `src/services/sessionService.js`
- `src/config/firebase.js`
- `vite.config.js`

## Related Docs

- [../README.md](../README.md)
- [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [../docs/FIREBASE_DATA_MODEL.md](../docs/FIREBASE_DATA_MODEL.md)

