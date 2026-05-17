import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cricketDataKey = process.env.CRICKETDATA_API_KEY;

// ⚠️ SET TO FALSE ONLY WHEN READY FOR THE FINAL DEMO TO SAVE YOUR 100 HITS
const DEV_MODE = true; 

// ---------------------------------------------------------
// 1. THE CRICKETDATA.ORG API FETCH
// ---------------------------------------------------------
async function fetchLiveMatchStats() {
    if (DEV_MODE) {
        console.log(`🟡 [DEV MODE]: Using cached Match Data to save CricketData.org quota...`);
        return JSON.stringify({
            name: "Chennai Super Kings vs Mumbai Indians",
            status: "CSK needs 34 runs in 18 balls. MI is bowling.",
            score: [
                { inning: "MI Inning 1", r: 190, w: 6, o: 20 },
                { inning: "CSK Inning 1", r: 157, w: 4, o: 17 }
            ],
            venue: "Wankhede Stadium, Mumbai"
        });
    }

    console.log(`🌐 [LIVE MODE]: Hitting CricketData.org API...`);
    try {
        // CricketData.org still uses the cricapi.com domain for its v1 endpoints
        const url = `https://api.cricapi.com/v1/currentMatches?apikey=${cricketDataKey}&offset=0`;
        const response = await axios.get(url);
        
        // Find a match that has started but not ended
        const activeMatch = response.data.data.find(match => match.matchStarted && !match.matchEnded);
        
        if (!activeMatch) {
            console.log("⚠️ No live matches right now. Falling back to the first available match for the demo.");
            const fallbackMatch = response.data.data[0];
            return JSON.stringify({
                name: fallbackMatch.name,
                status: fallbackMatch.status,
                score: fallbackMatch.score,
                venue: fallbackMatch.venue
            });
        }

        // Return a condensed payload so we don't blow up Gemini's context window
        return JSON.stringify({
            name: activeMatch.name,
            status: activeMatch.status,
            score: activeMatch.score,
            venue: activeMatch.venue
        });
    } catch (error) {
        console.error("❌ API Fetch Failed:", error.message);
        process.exit(1);
    }
}

// ---------------------------------------------------------
// 2. THE MULTI-AGENT ORCHESTRATOR
// ---------------------------------------------------------
async function runLiveDebate() {
    const liveMatchState = await fetchLiveMatchStats();
    
    console.log("\n🏏 Match Data Passed to Agents:\n", JSON.parse(liveMatchState), "\n");
    console.log("--------------------------------------------------\n");

    try {
        // ==========================================
        // AGENT 1: THE STATS ANALYST (Structured Output)
        // ==========================================
        console.log("📊 [Analyst evaluating JSON...]");
        
        const analystResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here is the live match JSON from CricketData.org: ${liveMatchState}. Propose the immediate next tactical move (bowling change, field setup, or batting aggression).`,
            config: {
                systemInstruction: "You are a data analyst. Extract the match state and propose a logical next move based purely on the numbers.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        currentSituation: { type: Type.STRING },
                        proposedMove: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["currentSituation", "proposedMove", "reasoning"]
                }
            }
        });
        
        const analystData = JSON.parse(analystResponse.text);
        console.log(`🤓 [Analyst Proposal]: ${analystData.proposedMove} - ${analystData.reasoning}\n`);
        console.log("--------------------------------------------------\n");

        // ==========================================
        // AGENT 2: THE DEVIL'S ADVOCATE 
        // ==========================================
        console.log("👿 [Devil's Advocate calculating counterfactuals...]");
        
        const advocateResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Match state: ${analystData.currentSituation}. The Analyst proposed: "${analystData.proposedMove}". Critique this plan and provide a counter-move. Estimate the win probability drop if we follow the Analyst.`,
            config: {
                systemInstruction: "You are the Devil's Advocate. Disagree with the analyst. Provide a realistic win-probability drop percentage.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flawInAnalystPlan: { type: Type.STRING },
                        counterMove: { type: Type.STRING },
                        winProbabilityDrop: { type: Type.STRING }
                    },
                    required: ["flawInAnalystPlan", "counterMove", "winProbabilityDrop"]
                }
            }
        });
        
        const advocateData = JSON.parse(advocateResponse.text);
        console.log(`⚠️ [Advocate Critique]: ${advocateData.flawInAnalystPlan}`);
        console.log(`📉 [Risk Metric]: Win prob drops by ${advocateData.winProbabilityDrop}. Counter: ${advocateData.counterMove}\n`);
        console.log("--------------------------------------------------\n");

        // ==========================================
        // AGENT 3: CAPTAIN COOL (Final Call)
        // ==========================================
        console.log("🧢 [Captain Cool is making the final call...]");
        
        const captainResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Context: ${analystData.currentSituation}\nAnalyst: ${analystData.proposedMove}\nAdvocate: ${advocateData.counterMove} (Warns of ${advocateData.winProbabilityDrop} drop).\n\nMake the final tactical call.`,
            config: {
                systemInstruction: "You are a legendary IPL captain like MS Dhoni. Read the structured arguments, but make a gut call. Speak purely in cricket slang (e.g. 'yorker', 'bring mid-off up'). Be decisive. One paragraph only."
            }
        });
        
        console.log(`\n🏆 [Captain Cool's Decision]:\n${captainResponse.text}\n`);
        
    } catch (error) {
        console.error("❌ Error in Agent Loop:", error.message);
    }
}

// Run it!
runLiveDebate();