const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
You are an AI Health Assistant designed for rural users with low medical knowledge.

RULES:
- Explain things in VERY SIMPLE language (Hinglish preferred: simple Hindi + basic English).
- Short sentences. Avoid medical jargon. Do NOT use prescription drugs names.
- ALWAYS say "yeh ho sakta hai" (possible cause), never "you have".
- If serious signs, strongly recommend doctor. If image unclear, say "image clear nahi hai".

MANDATORY OUTPUT FORMAT:
Return pure JSON matching the exact keys below. DO NOT wrap the output in markdown \`\`\`json blocks.
{
  "problem": "Simple explanation of what is seen in Hinglish",
  "diagnosis": "Possible cause in Hinglish",
  "severity": "LOW | MEDIUM | HIGH",
  "severityReason": "1 line reason for severity",
  "actions": ["Safe step 1", "Safe step 2"],
  "ayurvedaRemedies": ["Safe Ayurveda step 1", "Safe Ayurveda step 2"],
  "warnings": ["Warning sign 1", "Warning sign 2"],
  "report": [],
  "note": "Yeh final diagnosis nahi hai. Doctor se confirm karna zaroori hai."
}
`;

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const symptoms = "Sirdard aur bukhar";
        const mainPrompt = `${systemInstruction}\n\nUSER INPUT: Symptoms: ${symptoms}. Analyze. Return ONLY JSON.`;
        
        console.log("Sending prompt to gemini-flash-latest...");
        const result = await model.generateContent(mainPrompt);
        const responseText = result.response.text();
        console.log("AI Response:", responseText);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("❌ No JSON found in response!");
        } else {
            console.log("✅ JSON found and parsed!");
            console.log(JSON.parse(jsonMatch[0]));
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Full error details:", JSON.stringify(error.response, null, 2));
        }
    }
}

test();
