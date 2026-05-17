import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import readline from 'readline';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cricketDataKey = process.env.CRICKETDATA_API_KEY;

// Keep Dev Mode TRUE while testing to save API hits
const DEV_MODE = true;

// Setting up the terminal input for continuous memory
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// We will store the chat history here to satisfy the "Memory across overs" stretch goal
let matchHistory = [];

// Helper function to format images for Gemini Vision
function fileToGenerativePart(path, mimeType) {
    if (!fs.existsSync(path)) {
        console.log(`⚠️  Warning: ${path} not found. Running without visual pitch analysis.`);
        return null;
    }
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        }
    };
}

async function fetchLiveMatchStats() {
    if (DEV_MODE) {
        return JSON.stringify({
            name: "CSK vs RCB",
            status: "RCB needs 45 runs in 24 balls.",
            venue: "Chinnaswamy Stadium, Bengaluru"
        });
    }

    console.log(`🌐 [LIVE MODE]: Hitting Unofficial Cricbuzz API...`);
    
    const options = {
        method: 'GET',
        // This endpoint gets all currently live matches
        url: 'https://unofficial-cricbuzz.p.rapidapi.com/matches/list',
        params: { matchState: 'live' },
        headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'unofficial-cricbuzz.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        
        // Cricbuzz nests their live match data inside a 'typeMatches' array
        const liveMatches = response.data.typeMatches[0]?.seriesMatches[0]?.seriesAdWrapper?.matches;
        
        if (!liveMatches || liveMatches.length === 0) {
             console.log("⚠️ No live matches found on Cricbuzz right now.");
             return JSON.stringify({ name: "No live matches", status: "Please use DEV_MODE" });
        }

        // Grab the first live match
        const activeMatch = liveMatches[0].matchInfo;
        const matchScore = liveMatches[0].matchScore;

        // Build a clean payload for Gemini so we don't waste tokens
        const matchPayload = {
            team1: activeMatch.team1.teamName,
            team2: activeMatch.team2.teamName,
            status: activeMatch.status,
            venue: activeMatch.venueInfo.ground,
            currentScore: matchScore ? `${matchScore.team1Score?.inngs1?.runs || 0}/${matchScore.team1Score?.inngs1?.wickets || 0}` : "Score unavailable"
        };

        return JSON.stringify(matchPayload);

    } catch (error) {
        console.error("❌ Cricbuzz API Error:", error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

async function runMasterDebate(userUpdate = "Match is in a critical phase.") {
    console.log("\n==================================================");
    
    // Add the latest ball/event to memory
    matchHistory.push(`Latest Event: ${userUpdate}`);
    const memoryContext = matchHistory.join(" | ");

    const liveMatchState = await fetchLiveMatchStats();
    
    try {
        // ==========================================
        // AGENT 0: PITCH INSPECTOR (Multimodal Vision)
        // ==========================================
        let pitchAnalysisText = "No visual data provided.";
        const pitchImage = fileToGenerativePart("pitch.jpg", "image/jpeg");
        
        if (pitchImage) {
            console.log("👁️  [Pitch Inspector analyzing pitch.jpeg...]");
            const visionResponse = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [pitchImage, "Look at this cricket pitch. Describe the surface (dry, green, cracking) and tell me if it favors spin or pace. Keep it to one sentence."]
            });
            pitchAnalysisText = visionResponse.text;
            console.log(`🌱 [Pitch Inspector]: ${pitchAnalysisText}\n`);
        }

        // ==========================================
        // AGENT 1: THE STATS ANALYST (Structured JSON)
        // ==========================================
        console.log("📊 [Analyst evaluating API + Vision Data + Memory...]");
        const analystResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `API State: ${liveMatchState}. Pitch Condition: ${pitchAnalysisText}. Match History: ${memoryContext}. Propose the next tactical move.`,
            config: {
                systemInstruction: "You are a data analyst. Propose a logical next move based on the numbers and visual pitch data.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        proposedMove: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["proposedMove", "reasoning"]
                }
            }
        });
        const analystData = JSON.parse(analystResponse.text);
        console.log(`🤓 [Analyst]: ${analystData.proposedMove}\n`);

        // ==========================================
        // AGENT 2: THE DEVIL'S ADVOCATE (Counterfactuals)
        // ==========================================
        console.log("👿 [Devil's Advocate calculating risk...]");
        const advocateResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The Analyst proposed: "${analystData.proposedMove}". History: ${memoryContext}. Critique this plan. Estimate win probability drop.`,
            config: {
                systemInstruction: "You are the Devil's Advocate. Provide a counter-move and a realistic win-probability drop percentage.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        counterMove: { type: Type.STRING },
                        winProbabilityDrop: { type: Type.STRING }
                    },
                    required: ["counterMove", "winProbabilityDrop"]
                }
            }
        });
        const advocateData = JSON.parse(advocateResponse.text);
        console.log(`📉 [Advocate]: Drop of ${advocateData.winProbabilityDrop}. Counter: ${advocateData.counterMove}\n`);

        // ==========================================
        // AGENT 3: CAPTAIN COOL (Final Call)
        // ==========================================
        console.log("🧢 [Captain Cool is making the final call...]");
        const captainResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyst: ${analystData.proposedMove}\nAdvocate: ${advocateData.counterMove}.\nPitch: ${pitchAnalysisText}\nMake the final call.`,
            config: {
                systemInstruction: "You are a legendary IPL captain. Read the arguments and pitch data. Speak purely in cricket slang. One paragraph only."
            }
        });
        console.log(`\n🏆 [Captain Cool]:\n${captainResponse.text}\n`);
        
        // Add the Captain's call to memory
        matchHistory.push(`Captain's Move: ${captainResponse.text}`);

        // THE CONTINUOUS LOOP
        askNextMove();

    } catch (error) {
        console.error("❌ Error:", error.message);
        rl.close();
    }
}

function askNextMove() {
    console.log("--------------------------------------------------");
    rl.question('🎙️  What happened on that ball? (or type "exit" to quit): ', (answer) => {
        if (answer.toLowerCase() === 'exit') {
            console.log("🏏 Match Over. See you at the presentation ceremony!");
            rl.close();
        } else {
            runMasterDebate(answer);
        }
    });
}

// Start the engine
console.log("🏏 Booting up the Master System...");
runMasterDebate("First ball of the critical over coming up.");