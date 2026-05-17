import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// 1. Initialize Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 2. The Match State (You can change this for different screenshots for your blog)
const matchState = {
    teamBatting: "CSK",
    teamBowling: "MI",
    overs: 18.2,
    score: 175,
    wickets: 4,
    pitch: "Turning track, heavy dew in the outfield",
    striker: "MS Dhoni",
    nonStriker: "Ravindra Jadeja",
    target: 200,
    oversRemainingForBowlers: { "Bumrah": 1, "Piyush Chawla": 1, "Hardik": 1 }
};

const matchContext = JSON.stringify(matchState, null, 2);

async function runDebate() {
    console.log("🏏 Match Situation:\n", matchContext, "\n");
    console.log("--------------------------------------------------\n");

    try {
        // ==========================================
        // AGENT 1: THE STATS ANALYST
        // ==========================================
        console.log("📊 [Analyst is crunching data and checking weather...]");

        const analystResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Look at this match state: ${matchContext}. Propose the next bowling move. Should they bowl spin or pace? Check the weather/dew impact.`,
            config: {
                systemInstruction: "You are a data-driven cricket analyst. Base your advice purely on matchups, pitch conditions, and stats. Keep it concise (2-3 sentences).",
                tools: [{ googleSearch: {} }] // Hits the mandatory tool requirement!
            }
        });

        const analystPlan = analystResponse.text;
        console.log(`\n🤓 [Analyst Proposal]:\n${analystPlan}\n`);
        console.log("--------------------------------------------------\n");

        // ==========================================
        // AGENT 2: THE DEVIL'S ADVOCATE
        // ==========================================
        console.log("👿 [Devil's Advocate is finding flaws...]");

        const advocateResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Match State: ${matchContext}\n\nThe Analyst proposed this plan: "${analystPlan}".\n\nFind the flaws in this plan. Argue why it will fail against MS Dhoni and Jadeja. Propose the opposite.`,
            config: {
                systemInstruction: "You are the Devil's Advocate. Your sole purpose is to disagree with the Analyst and point out why their plan is risky. Be sharp and direct. (2-3 sentences)."
            }
        });

        const advocateCritique = advocateResponse.text;
        console.log(`\n⚠️ [Advocate Critique]:\n${advocateCritique}\n`);
        console.log("--------------------------------------------------\n");

        // ==========================================
        // AGENT 3: CAPTAIN COOL (Final Decision)
        // ==========================================
        console.log("🧢 [Captain Cool is making the final call...]");

        const captainResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Match State: ${matchContext}\n\nAnalyst says: "${analystPlan}"\nAdvocate says: "${advocateCritique}"\n\nMake the final tactical call. Who bowls the next ball and what is the field setup?`,
            config: {
                systemInstruction: "You are a legendary IPL captain like MS Dhoni or Rohit Sharma. You listen to the data, but make gut calls. Speak purely in cricket slang (e.g., 'bowl into the pitch', 'yorker at the toes', 'bring third man up'). Be decisive. Explain your reasoning in 3-4 sentences."
            }
        });

        console.log(`\n🏆 [Captain Cool's Decision]:\n${captainResponse.text}\n`);

    } catch (error) {
        console.error("❌ Error in Debate Loop:", error.message);
    }
}

// Run the application
runDebate();