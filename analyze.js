const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SYSTEM_INSTRUCTION = `
You are an AI Health Assistant for rural users. 
Explain in VERY SIMPLE Hinglish (Hindi + basic English).
Avoid medical jargon. No medicine names.
Always say "yeh ho sakta hai". 
Return ONLY JSON format:
{
  "problem": "Simple explanation of what is seen",
  "diagnosis": "Possible cause",
  "severity": "LOW | MEDIUM | HIGH",
  "severityReason": "Reason for severity",
  "actions": ["Step 1", "Step 2"],
  "ayurvedaRemedies": ["Home remedy 1", "Home remedy 2"],
  "warnings": ["Warning 1"],
  "note": "Final checkup doctor se karein."
}
`;

async function callGemini(modelName, prompt, imagePart, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // 10 second timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
        const parts = imagePart ? [prompt, imagePart] : [prompt];
        const result = await model.generateContent(parts, { signal: controller.signal });
        const text = result.response.text();
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

app.post("/api/analyze", upload.single("image"), async (req, res) => {
    console.log("REQUEST RECEIVED: /api/analyze");
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Invalid API Key: Missing GEMINI_API_KEY env var");

        if (!req.file && !req.body.symptoms) {
            return res.status(400).json({ success: false, error: "bad request: No file or symptoms provided" });
        }

        if (req.file) {
            console.log("IMAGE RECEIVED. SIZE:", (req.file.size / 1024).toFixed(2), "KB");
            if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
                return res.status(400).json({ success: false, error: "bad request: Only jpeg/png allowed" });
            }
        }

        const symptoms = req.body.symptoms || "Checkup request.";
        const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nUSER INPUT: ${symptoms}. Analyze and return JSON.`;
        
        let imagePart = null;
        if (req.file) {
            imagePart = {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: req.file.buffer.toString("base64")
                }
            };
        }

        let aiResponse = "";
        let attempt = 0;
        const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];

        while (attempt < 3) {
            try {
                const currentModel = models[attempt] || models[0];
                aiResponse = await callGemini(currentModel, fullPrompt, imagePart, apiKey);
                if (aiResponse) break;
            } catch (err) {
                console.error(`ATTEMPT ${attempt + 1} FAILED:`, err.message);
                if (attempt < 2) {
                    await sleep(1000);
                    attempt++;
                } else {
                    throw err;
                }
            }
        }

        if (!aiResponse) throw new Error("empty response from Gemini");
        console.log("GEMINI RAW RESPONSE:", aiResponse);

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response format");
        
        const resultData = JSON.parse(jsonMatch[0]);
        const finalOutput = {
            success: true,
            result: resultData.problem || "Analysis completed",
            ...resultData // Keep all fields for frontend compatibility
        };

        console.log("FINAL OUTPUT:", JSON.stringify(finalOutput));
        res.json(finalOutput);

    } catch (error) {
        console.error("FULL ERROR:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        });
    }
});

module.exports = app;
