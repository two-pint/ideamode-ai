# IdeaMode Mobile

Expo (React Native) app for IdeaMode, **SDK 55**. Connects to the same Rails API as the web app.

After pulling or if you see peer dependency warnings, run from this directory: `pnpm exec expo install --fix` to align SDK 55–compatible versions.

## Run

```bash
pnpm install
pnpm exec expo start
```

Open in Expo Go on a device or simulator.

## API URL

Set `EXPO_PUBLIC_API_URL` in a `.env` file (e.g. `http://localhost:3000`). For a physical device, use your machine’s IP (e.g. `http://192.168.1.10:3000`) and ensure the API allows that origin in CORS.

The home screen shows "IdeaMode Mobile" and, when the URL is set, calls `GET /health` to verify connectivity.
