"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const prisma_1 = __importDefault(require("../db/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY must be set in environment variables");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
/** Match GeminiResponseHandler and allow override via .env (invalid model names break chat). */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
// List available models (if needed)
router.get("/models", async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "Failed to fetch models");
        }
        const modelList = data.models?.map((model) => ({
            name: model.name.replace('models/', ''),
            displayName: model.displayName,
            description: model.description,
            supportedMethods: model.supportedGenerationMethods
        })) || [];
        res.json({
            success: true,
            count: modelList.length,
            models: modelList
        });
    }
    catch (error) {
        console.error("Error listing models:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Send message to AI and save to database
router.post("/chat/:chatId", auth_1.authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Verify chat ownership
        const chat = await prisma_1.default.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        // Save user message to database
        const userMessage = await prisma_1.default.message.create({
            data: {
                chatId,
                role: "user",
                content: message,
            },
        });
        // Build conversation history for AI
        const conversationHistory = chat.messages.map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));
        // Add current message
        conversationHistory.push({
            role: "user",
            parts: [{ text: message }],
        });
        // Generate AI response
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction: "You are a helpful AI assistant. Be concise and match your response length to the question's complexity. For simple questions, give brief, clear answers (2-4 sentences). Only provide detailed explanations when the user asks for more detail or when the question is complex. Avoid unnecessary verbosity."
        });
        const chatSession = model.startChat({
            history: conversationHistory.slice(0, -1), // Exclude the last message as it will be sent separately
        });
        const result = await chatSession.sendMessage(message);
        const aiResponse = result.response.text();
        // Save AI response to database
        const aiMessage = await prisma_1.default.message.create({
            data: {
                chatId,
                role: "assistant",
                content: aiResponse,
            },
        });
        // Auto-rename chat if it's still "New Chat" and this is the first message
        if (chat.title === "New Chat" && chat.messages.length === 0) {
            // Truncate message to max 50 characters for the title
            const newTitle = message.length > 50 ? message.substring(0, 47) + "..." : message;
            await prisma_1.default.chat.update({
                where: { id: chatId },
                data: {
                    title: newTitle,
                    updatedAt: new Date()
                },
            });
        }
        else {
            // Update chat's updatedAt timestamp
            await prisma_1.default.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });
        }
        res.status(200).json({
            userMessage,
            aiMessage,
        });
    }
    catch (error) {
        console.error("AI chat error:", error);
        res.status(500).json({ error: "Failed to process AI request" });
    }
});
// Streaming AI response (for real-time chat experience)
router.post("/chat/:chatId/stream", auth_1.authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Verify chat ownership
        const chat = await prisma_1.default.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        // Save user message
        await prisma_1.default.message.create({
            data: {
                chatId,
                role: "user",
                content: message,
            },
        });
        // Build conversation history
        const conversationHistory = chat.messages.map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));
        conversationHistory.push({
            role: "user",
            parts: [{ text: message }],
        });
        // Set up streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        let isConnectionOpen = true;
        req.on("close", () => {
            isConnectionOpen = false;
        });
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction: "You are a helpful AI assistant. Be concise and match your response length to the question's complexity. For simple questions, give brief, clear answers (2-4 sentences). Only provide detailed explanations when the user asks for more detail or when the question is complex. Avoid unnecessary verbosity."
        });
        const chatSession = model.startChat({
            history: conversationHistory.slice(0, -1),
        });
        const result = await chatSession.sendMessageStream(message);
        let fullResponse = "";
        for await (const chunk of result.stream) {
            if (!isConnectionOpen)
                break;
            try {
                const text = chunk.text();
                if (!text)
                    continue;
                fullResponse += text;
                res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
            }
            catch (chunkErr) {
                console.warn("Gemini stream chunk skipped:", chunkErr);
            }
        }
        if (!isConnectionOpen) {
            console.log("Client disconnected, stopping stream");
            return;
        }
        // Save complete AI response to database
        await prisma_1.default.message.create({
            data: {
                chatId,
                role: "assistant",
                content: fullResponse,
            },
        });
        // Auto-rename chat if it's still "New Chat" and this is the first message
        if (chat.title === "New Chat" && chat.messages.length === 0) {
            // Truncate message to max 50 characters for the title
            const newTitle = message.length > 50 ? message.substring(0, 47) + "..." : message;
            await prisma_1.default.chat.update({
                where: { id: chatId },
                data: {
                    title: newTitle,
                    updatedAt: new Date()
                },
            });
        }
        else {
            // Update chat timestamp
            await prisma_1.default.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });
        }
        // Signal completion
        res.write(`data: ${JSON.stringify({ event: "end" })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error("AI stream error:", error);
        const message = error instanceof Error ? error.message : "Failed to process AI request";
        if (!res.headersSent) {
            res.status(500).json({ error: message });
        }
        else {
            res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
            res.end();
        }
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map