# 🏏 Captain Cool: The Multi-Agent IPL Strategist

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![RapidAPI](https://img.shields.io/badge/RapidAPI-005571?style=for-the-badge&logo=rapidapi&logoColor=white)

**Captain Cool** is an interactive, CLI-based Virtual Strategy Room built entirely on the Google Gemini stack. It ingests live match states, visual pitch data, and historical ball-by-ball context to debate the next best move before delivering a final, captain-style tactical decision.

Built during a rapid vibe-coding session in **Google Antigravity**.

## 🧠 The Agentic Architecture

This is not a single-prompt chatbot. The system utilizes four distinct, highly specialized AI agents that collaborate and debate deterministically:

1. **👁️ The Pitch Inspector (Multimodal):** Ingests an image of the pitch using Gemini's Vision capabilities to analyze surface conditions (spin vs. pace bias).
2. **📊 The Stats Analyst (Structured Output):** Ingests the API match state, pitch conditions, and historical memory. Uses Gemini's `responseSchema` to output a strict JSON payload proposing the next tactical move.
3. **👿 The Devil's Advocate (Counterfactuals):** Ingests the Analyst's JSON, critiques it, and outputs a strict JSON payload detailing a counter-move and a numeric `winProbabilityDrop` metric.
4. **🧢 Captain Cool (The Final Call):** Reads the structured arguments and visual data, synthesizing them into a decisive gut call delivered in authentic cricket slang.

## ✨ Key Features
* **Multi-Turn Memory Loop:** The CLI remembers what happened on previous balls and adjusts its strategy dynamically.
* **Deterministic Handoffs:** Agents communicate via strict JSON schemas, preventing hallucination cascades.
* **Live Match Support:** Built-in integration for the Unofficial Cricbuzz API (via RapidAPI) to fetch live scores.
* **Mock Data Engine:** Includes a robust `mock_scenario.json` for guaranteed testing without network dependencies.
* **Beautiful CLI:** Color-coded agent outputs using `chalk` and terminal loading states using `ora`.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* A [Google Gemini API Key](https://aistudio.google.com/)
* A [RapidAPI Key](https://rapidapi.com/) (for the Cricbuzz integration)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shubhamxpawar/cool-cricket-agent.git
   cd cool-cricket-agent
   ```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up Environment Variables:**
Create a .env file in the root directory and add your API keys:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

4. **Run the CLI**
```bash
node cli.js
```
