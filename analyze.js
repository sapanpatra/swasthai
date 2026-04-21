const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const systemInstruction = `
You are an AI Health Assistant designed for rural users with low medical knowledge.
RULES:
- Explain things in VERY SIMPLE language (Hinglish preferred).
- Short sentences. Avoid medical jargon. Do NOT use prescription drugs names.
- ALWAYS say "yeh ho sakta hai", never "you have".
- MANDATORY OUTPUT FORMAT: Return pure JSON.
{
  "problem": "...",
  "diagnosis": "...",
  "severity": "LOW | MEDIUM | HIGH",
  "actions": ["..."],
  "ayurvedaRemedies": ["..."],
  "warnings": ["..."],
  "note": "..."
}
`;

app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

        const symptoms = req.body.symptoms || "No symptoms provided.";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `${systemInstruction}\n\nUSER INPUT: Symptoms: ${symptoms}. Return ONLY JSON.`;
        
        let result;
        if (req.file) {
            const imagePart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));
        
    } catch (error) {
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

module.exports = app;
