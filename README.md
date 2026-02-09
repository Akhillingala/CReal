# SeeReal - Real-time News Transparency & 3D Insights

## Inspiration
In an era of rapid information flow and polarized media, understanding the *context* behind a news story is often harder than reading the story itself. SeeReal was born from a simple need: we wanted to provide readers with a **sophisticated, AI-augmented research layer** that lives directly on the page—transforming passive news consumption into active, critical analysis. We wanted to make the invisible bias visible.

---

## What it does
SeeReal is a high-performance Chrome extension that injects a 3D transparency overlay directly into news articles. Think of it as a pair of X-ray specs for the internet.

### Key Features
- **3D-Visualized Bias Metrics**: Explore article nuance through a **3D Radar Chart** (@react-three/fiber). It maps 6 critical semantic axes including Authoritarian/Libertarian and Sensationalism, normalizing complex model outputs into real-time vertex coordinates.
- **AI-Powered "Debate Cards"**: A specialized tool to extract evidence. It uses structured prompt engineering to identify specific claims and dynamically highlights them in the article body while preserving the DOM.
- **Intelligent Author Profiling**: We aggregate professional background data using Gemini-powered searches to identify historical patterns in an author's output.
- **Google Veo 3.1 Video Synthesis**: Generates <15s visual recaps of article insights, handling asynchronous polling and complex URI extraction from deep API structures.
- **Persistent Storage**: Built on `chrome.storage.local` with a custom service layer for O(1) list views and automated 30-day cleanup.

---

## How we built it
We built SeeReal using a modern, reactive stack designed for performance and visual impact.
- **Frontend**: **React 18** and **TypeScript** (Strict Mode) form our core. We used **Zustand** for lightweight state management and **Framer Motion** for those smooth UI transitions.
- **3D Graphics**: The heartbeat of our visualization is **Three.js** and **React Three Fiber**, with custom **GLSL shaders** for the transparency overlay.
- **AI Brain**: We leveraged **Google Gemini 1.5 Flash & 2.0 Pro** with a dynamic fallback system. For video synthesis, we integrated **Google Veo 3.1**.
- **Infrastructure**: The extension is built on **Chrome Extension V3 Architecture**, bundled with **Webpack 5**.

---

## Challenges we ran into
Building a sophisticated 3D engine *inside* a browser extension isn't for the faint of heart.
- **Content Script Constraints**: Injecting a Three.js canvas into arbitrary third-party websites without breaking their original layouts or scripts was a major technical hurdle.
- **Async Data Polling**: Google Veo's video generation is an asynchronous process. We had to build a robust polling engine with exponential backoff to handle long-running operations without blocking the main UI thread.
- **Semantic Normalization**: Converting raw NLP model outputs into consistent coordinates for a 3D radar chart required significant mathematical tuning to ensure the visualization remained intuitive.

---

## Accomplishments that we're proud of
- **Seamless 3D Overlay**: We managed to create a glassmorphic 3D interface that feels native to the browser, regardless of the website you're visiting.
- **Automated Evidence Extraction**: Our "Debate Cards" feature effectively turns a 10-minute research session into a 10-second automation.
- **Multi-Modal AI Integration**: Successfully orchestrating Gemini for text analysis and Veo for video summaries within a single user flow.

---

## What we learned
- **Extension Life-cycles**: We deep-dived into the nuances of Service Workers vs. Content Scripts in Manifest V3.
- **GLSL and Vertex Math**: Visualizing data in 3D taught us a lot about normalizing bipolar model data into spatial coordinates.
- **Prompt Engineering**: We learned how to refine prompts to get structured, reliable JSON outputs from multi-modal LLMs for research purposes.

---

## What's next for SeeReal
We're just getting started. Our roadmap includes:
- **Cross-Source Differential Analysis**: Comparing the "information gap" between two outlets covering the same event using cosine similarity on embeddings.
- **Real-time LLM Verification**: Active factual cross-referencing against trusted knowledge bases.
- **Agentic Research Mode**: Letting SeeReal autonomously expand its research graph by fetching related articles and summarizing entire topics into briefs.

---

## Setup & Configuration

### Installation & Build
```bash
npm install
npm run build
```

### Deployment
Load the unpacked extension from the `dist` folder via `chrome://extensions`.

### API Access
Gemini API keys are configured via the extension popup or `.env.local`.

---

**Built With**
- React / TypeScript / Zustand / Framer Motion
- Three.js / React Three Fiber / WebGL / GLSL
- Google Gemini & Veo APIs
- Chrome Extension V3 Architecture
