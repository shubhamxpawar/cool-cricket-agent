import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash-lite';

export async function pitchInspector(imagePath) {
    if (!fs.existsSync(imagePath)) {
        return "No visual data provided.";
    }
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const inlineData = {
        data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
        mimeType
    };
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                { inlineData },
                "Look at this cricket pitch. Describe the surface (dry, green, cracking) and tell me if it favors spin or pace. Keep it to one sentence."
            ]
        });
        return response.text;
    } catch (e) {
        return `Vision analysis failed: ${e.message}`;
    }
}

export async function statsAnalyst(scenario, pitchOutput, matchHistory) {
    const prompt = `Match State: ${JSON.stringify(scenario)}. \nPitch Condition: ${pitchOutput}. \nHistory: ${matchHistory.join(" | ")}. \nPropose the next tactical move.`;
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
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
    return JSON.parse(response.text);
}

export async function devilsAdvocate(analystProposal, matchHistory) {
    const prompt = `The Analyst proposed: "${analystProposal.proposedMove}". \nHistory: ${matchHistory.join(" | ")}. \nCritique this plan. Provide a flaw, a counter-move, and a realistic win-probability drop percentage.`;
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            systemInstruction: "You are the Devil's Advocate. Provide a realistic counter-move and win-probability drop percentage.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    flaw: { type: Type.STRING },
                    counterMove: { type: Type.STRING },
                    winProbabilityDrop: { type: Type.NUMBER }
                },
                required: ["flaw", "counterMove", "winProbabilityDrop"]
            }
        }
    });
    return JSON.parse(response.text);
}

export async function captainCool(analystProposal, advocateProposal) {
    const prompt = `Analyst: ${analystProposal.proposedMove} (Reasoning: ${analystProposal.reasoning})\nAdvocate: ${advocateProposal.counterMove} (Flaw in Analyst plan: ${advocateProposal.flaw})\nMake the final call.`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            systemInstruction: "You are a legendary IPL captain like MS Dhoni. Read the arguments. Speak purely in authentic, slang-heavy cricket commentary style. Make the final call. One paragraph only."
        }
    });
    return response.text;
}
