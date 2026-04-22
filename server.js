const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend HTML files
app.use(express.static(__dirname));

// Use memory storage for fast processing without writing files to disk
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getAIResponse(prompt, imagePart = null) {
    const models = ["gemini-2.5-flash", "gemini-flash-latest"];
    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting AI generation with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await (imagePart ? model.generateContent([prompt, imagePart]) : model.generateContent(prompt));
            const text = result.response.text();
            console.log(`Successfully generated content with ${modelName}`);
            return text;
        } catch (error) {
            console.error(`Model ${modelName} failed:`, error.message);
            lastError = error;
            if (error.status === 429) {
                console.warn("Quota exceeded for this model, trying next...");
            }
        }
    }
    throw lastError || new Error("All AI models failed");
}

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
  "ayurvedaRemedies": ["Safe Ayurveda step 1", "Safe Ayurveda step 2"], // NEW: Traditional home remedies inspired by Ayurveda in Hinglish
  "warnings": ["Warning sign 1", "Warning sign 2"],
  "report": [{"title": "Sugar High", "desc": "Simple reason"}], // Populate ONLY if a medical report is detected, otherwise empty array []
  "note": "Yeh final diagnosis nahi hai. Doctor se confirm karna zaroori hai."
}
`;

app.get("/api/test", (req, res) => res.json({ status: "Backend is working!", keyDetected: !!process.env.GEMINI_API_KEY }));

app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Config Error", details: "GEMINI_API_KEY missing in Vercel settings." });
        }

        const symptoms = req.body.symptoms || "No symptoms provided.";
        const mainPrompt = `${systemInstruction}\n\nUSER INPUT: Symptoms: ${symptoms}. Analyze any attached image and symptoms. Return ONLY JSON.`;
        
        let imagePart = null;
        if (req.file) {
            imagePart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };
        }

        const responseText = await getAIResponse(mainPrompt, imagePart);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI response was not JSON: " + responseText.substring(0, 50));
        
        res.json(JSON.parse(jsonMatch[0]));
        
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message, context } = req.body;
        const prompt = `CONTEXT: ${JSON.stringify(context)}\nINSTRUCTION: Respond in simple Hinglish, max 2 sentences. No meds.\nUSER: ${message}`;
        const responseText = await getAIResponse(prompt);
        res.json({ reply: responseText });
    } catch (error) {
        res.status(500).json({ error: "Chat failed", details: error.message });
    }
});

app.post("/api/translate", async (req, res) => {
    try {
        const { analysis, language } = req.body;
        console.log(`Translation request for language: ${language}`);

        const translationPrompt = `
You are a professional medical translator. 
Translate the following health analysis JSON into ${language}. 

RULES:
1. Maintain the EXACT same JSON structure.
2. Use very SIMPLE, friendly, and reassuring language suitable for rural users.
3. Keep medical terms simple or explain them if they must be used.
4. DO NOT change the "severity" value (LOW/MEDIUM/HIGH).
5. Only translate the values, not the keys.

Analysis to translate:
${JSON.stringify(analysis)}

Return ONLY the translated JSON.
`;

        const responseText = await getAIResponse(translationPrompt);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const finalJsonString = jsonMatch ? jsonMatch[0] : responseText;
        
        res.json(JSON.parse(finalJsonString));
    } catch (error) {
        console.error("Translation Error:", error);
        res.status(500).json({ error: "Translation failed", details: error.message });
    }
});

// Explicitly serve index.html for the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
});

// Serve static files (CSS, JS, etc.)
app.use(express.static(process.cwd()));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Swasth AI Backend running on port ${PORT}`);
    });
}

module.exports = app;
