# CodeOptAI

CodeOptAI is a full-stack AI-powered code optimizer web app.

## What This Website Does

CodeOptAI lets users paste code into a browser-based editor and send it to an AI model for improvement. The app returns an optimized version of the code, explains what changed, highlights possible bugs, and gives practical suggestions for readability, maintainability, and performance.

It is built for quick code reviews and refactoring assistance across multiple languages, with a split-screen developer experience that makes comparing original and optimized code easy.

## Features

- Monaco editor for JavaScript, Python, C++, and Java
- AI optimization with explanation and practical suggestions
- Side-by-side original vs optimized output
- Copy and download optimized code
- Bonus tools: Explain Code, Find Bugs, basic complexity estimate
- In-memory optimization history in backend API

## Project Structure

- `frontend/` - React + Vite + TypeScript + Tailwind + Monaco
- `backend/` - Express API and LLM integration (OpenAI-compatible / Groq)

## Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
# add your API key in .env (GROQ_API_KEY)
npm install
npm run dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:4000` by default.

## How It Works

1. Users paste code into the Monaco editor and choose a programming language.
2. The frontend sends the code to the backend using async API calls.
3. The backend forwards the request to Groq using its OpenAI-compatible chat completions API.
4. The model returns optimized code, explanations, suggestions, and basic complexity notes.
5. The frontend renders the original and optimized code side by side, along with bug-finding and explanation outputs.

## Environment Variables

### Backend (`backend/.env`)

- `PORT` - backend port (default: `4000`)
- `LLM_PROVIDER` - `groq` (default) or `openai`
- `GROQ_BASE_URL` - Groq-compatible base URL (`https://api.groq.com/openai/v1`)
- `GROQ_MODEL` - model id (example: `llama-3.3-70b-versatile`)
- `GROQ_API_KEY` - API key for Groq
- `ALLOW_FALLBACK` - set `true` only if you want offline fallback behavior

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL` - backend API URL (default: `http://localhost:4000/api`)
- `VITE_USE_PUTER` - set `true` to optimize code directly with puter.js
- `VITE_PUTER_MODEL` - puter model id used for direct optimization mode

## API Endpoints

- `POST /api/optimize`
- `POST /api/explain`
- `POST /api/find-bugs`
- `GET /api/history`
- `GET /api/health`
