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

app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
        const symptoms = req.body.symptoms || "No symptoms provided.";
        console.log("Analyzing request... Symptoms:", symptoms);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction 
        });

        const prompt = `Please analyze the provided input. User Symptoms: ${symptoms}. Give your assessment strictly in the requested JSON format.`;
        
        let result;
        if (req.file) {
            console.log("Processing image file...");
            const imagePart = {
                inlineData: {
                    data: req.file.buffer.toString("base64"),
                    mimeType: req.file.mimetype
                }
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            console.log("Processing text only...");
            result = await model.generateContent(prompt);
        }

        const responseText = result.response.text();
        // Fallback robust parsing in case Gemini includes markdown tags
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const finalJsonString = jsonMatch ? jsonMatch[0] : responseText;
        
        res.json(JSON.parse(finalJsonString));
        
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message, context } = req.body;
        console.log("Chat request received:", message);

        const chatInstruction = `You are Swasth AI, a helpful health assistant meant for rural users. 
You are answering a follow-up question from the patient after giving them an initial analysis.
RULES:
1. Speak in VERY simple Hinglish (Hindi + simple English).
2. Keep responses very short (2-3 sentences max).
3. Be reassuring but DO NOT prescribe medicines or drugs. 

Here is what you previously told the patient (Context):
${JSON.stringify(context)}
`;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: chatInstruction 
        });

        const result = await model.generateContent(message);
        res.json({ reply: result.response.text() });
    } catch (error) {
        console.error("Chat Error:", error);
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(translationPrompt);
        
        const responseText = result.response.text();
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
    res.sendFile(path.join(__dirname, "index.html"));
});

// Serve static files (CSS, JS, etc.)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Swasth AI Backend running on port ${PORT}`);
    });
}

module.exports = app;
