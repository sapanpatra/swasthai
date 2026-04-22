const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We have to use raw REST fetch because SDK doesn't expose listModels in this older way depending on version.
        // Actually it might be genAI.getModels() or just REST API.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            const models = data.models.map(m => m.name);
            console.log("Models found:", models);
        } else {
            console.log("Full response:", JSON.stringify(data, null, 2));
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
