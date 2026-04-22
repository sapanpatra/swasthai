require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const systemInstruction = `
You are an AI Health Assistant designed for rural users with low medical knowledge.
RULES:
- Explain things in VERY SIMPLE language (Hinglish preferred: simple Hindi + basic English).
- Short sentences. Avoid medical jargon. Do NOT use prescription drugs names.
- ALWAYS say "yeh ho sakta hai" (possible cause), never "you have".
- If serious signs, strongly recommend doctor. If image unclear, say "image clear nahi hai".
MANDATORY OUTPUT FORMAT:
Return pure JSON matching the exact keys below.
{
  "problem": "Simple explanation",
  "diagnosis": "Possible cause",
  "severity": "LOW | MEDIUM | HIGH",
  "severityReason": "Reason",
  "actions": ["Step 1"],
  "ayurvedaRemedies": ["Step 1"],
  "warnings": ["Warning 1"],
  "report": [],
  "note": "Disclaimer"
}
`;

async function test() {
    const models = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.5-flash"];
    for (const modelName of models) {
        try {
            console.log(`Testing AI with model: ${modelName}...`);
            const m = genAI.getGenerativeModel({ model: modelName });
            const result = await m.generateContent(`${systemInstruction}\n\nUSER INPUT: Symptoms: Sirdard aur bukhar. Analyze. Return ONLY JSON.`);
            const text = result.response.text();
            console.log(`✅ Success for ${modelName}!`);
            console.log("AI Response:", text);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                JSON.parse(jsonMatch[0]);
                console.log(`✅ Valid JSON from ${modelName}!`);
            }
            return; // Stop on first success
        } catch (e) {
            console.error(`❌ Error for ${modelName}:`, e.message);
        }
    }
}

test();
