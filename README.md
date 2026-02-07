# CReal - News Transparency Extension

Real-time, 3D-visualized transparency metrics for news articles using AI analysis.

## Phase 1 MVP Features

- **Article Extraction** – Extracts article text from news pages
- **Bias Detection** – Multi-axis political bias analysis via Gemini Flash
- **2D Overlay** – Glass morphism UI with bias visualization
- **Minimizable Interface** – Compact floating button when idle

## Setup

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

Load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## API Key Configuration

1. Get a [Gemini API key](https://aistudio.google.com/apikey) from Google AI Studio
2. Either put it in `.env.local` as `GEMINI_API_KEY=your_key` and run `npm run build`, or click the CReal extension icon → paste key → "Save"
3. **"API key not valid" in extension but `npm run test:gemini` works?** Your key may have **application restrictions**. In [Google AI Studio](https://aistudio.google.com/apikey) or [Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), edit the key → set **Application restrictions** to **None** (referrer restrictions block extension requests).

## Usage

1. Navigate to a news article
2. Click the floating CReal button (bottom-right)
3. Click "Analyze" to run bias detection
4. View Left/Right, Authoritarian/Libertarian, and Nationalist/Globalist scores

## Project Structure

```
creal-extension/
├── manifest.json          # Chrome Extension Manifest V3
├── src/
│   ├── background/        # Service worker, API manager
│   ├── content/           # Content script, overlay
│   ├── lib/               # Analyzers, utils
│   ├── popup/             # Extension popup (API key)
│   └── styles/            # Global CSS
├── public/icons/          # Extension icons
└── dist/                  # Build output
```

## Tech Stack

- React 18 + TypeScript
- Gemini 1.5 Flash (bias analysis)
- Framer Motion (animations)
- Tailwind CSS
- Webpack 5

## Roadmap

- **Phase 2**: 3D BiasGlobe, credibility scoring, AI content detection
- **Phase 3**: Full 8 visualizations, video summaries, user accounts
