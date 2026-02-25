# Face Off — Lip Reading AI

A web app that uses your camera to detect faces and transcribe speech from lip movements using the [basord/lip-reading-ai-vsr](https://replicate.com/basord/lip-reading-ai-vsr) model on Replicate.

## How it works

1. Open the app — your camera feed appears
2. Tap a detected face to select it (dashed outlines show detected faces)
3. Press **Record** — the app silently slices 12-second video clips of the selected face and sends them to the Replicate API in the background
4. Transcripts appear in order as they come back, with a waveform animation while processing

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add the environment variable `REPLICATE_API_KEY` in the Vercel project settings
4. Deploy — Vercel auto-detects Vite and the `api/` serverless functions

## Local development

```bash
npm install
```

Create a `.env` file:

```
REPLICATE_API_KEY=your_key_here
```

One command starts everything (API server + frontend) and opens your browser:

```bash
npm run dev
```

The app opens at `http://localhost:5173`. Allow camera access when prompted.

## Tech stack

- **React** + **Vite** — frontend
- **face-api.js** — face detection (TinyFaceDetector)
- **Vercel Serverless Functions** — API (also runs locally via Express)
- **Replicate** — lip reading model (`basord/lip-reading-ai-vsr`)
