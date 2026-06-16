"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const generative_ai_1 = require("@google/generative-ai");
const path_1 = __importDefault(require("path"));
const GeminiResponseHandler_1 = require("./agents/gemini/GeminiResponseHandler");
const serverClient_1 = require("./serverClient");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const chat_1 = __importDefault(require("./routes/chat"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
const geminiApiKey = process.env.GEMINI_API_KEY;
const aiUserId = process.env.AI_USER_ID ?? "ai-bot";
const aiUserName = process.env.AI_USER_NAME ?? "AI Assistant";
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY must be set in environment variables");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
const activeHandlers = new Map();
const ensureAiUser = async () => {
    await serverClient_1.serverClient.upsertUser({
        id: aiUserId,
        name: aiUserName,
        role: "user",
    });
};
const reactBuildDir = path_1.default.join(__dirname, "..", "..", "frontend-react", "build");
const legacyFrontendDir = path_1.default.join(__dirname, "..", "..", "frontend");
const publicDir = fs_1.default.existsSync(reactBuildDir) ? reactBuildDir : legacyFrontendDir;
app.use("/app", express_1.default.static(publicDir));
console.log("Serving frontend from:", publicDir);
// Serve uploaded files
const uploadsDir = path_1.default.join(__dirname, "..", "uploads");
app.use("/uploads", express_1.default.static(uploadsDir));
console.log("Serving uploads from:", uploadsDir);
// Mount API routes
app.use("/api/auth", auth_1.default);
app.use("/api/user", user_1.default);
app.use("/api/chats", chat_1.default);
app.use("/api/ai", ai_1.default);
app.post("/token", express_1.default.json(), async (req, res) => {
    const { userId, name, channelId } = req.body;
    if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
    }
    // Sanitize userId: replace invalid chars with hyphens, only allow a-z, 0-9, @, _, -
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9@_-]/g, '-');
    try {
        await serverClient_1.serverClient.upsertUser({
            id: sanitizedUserId,
            name: name ?? userId,
            role: "user",
        });
        const token = serverClient_1.serverClient.createToken(sanitizedUserId);
        // If channelId provided, create channel and add user as member
        if (channelId) {
            try {
                const channel = serverClient_1.serverClient.channel("messaging", channelId, {
                    created_by_id: sanitizedUserId,
                });
                await channel.create();
                await channel.addMembers([sanitizedUserId, aiUserId]);
            }
            catch (error) {
                // Channel might already exist, that's okay
                console.log("Channel setup:", error);
            }
        }
        res.status(200).json({
            token,
            apiKey: serverClient_1.apikey,
            userId: sanitizedUserId,
            name: name ?? userId,
        });
    }
    catch (error) {
        console.error("Token creation failed:", error);
        res.status(500).json({ error: "Token creation failed" });
    }
});
app.post("/ai-reply", async (req, res) => {
    const { channelType, channelId, messageText, userId } = req.body;
    if (!messageText) {
        res.status(400).json({ error: "messageText is required" });
        return;
    }
    try {
        const channel = serverClient_1.serverClient.channel(channelType || "messaging", channelId, {
            members: [aiUserId, userId].filter(Boolean),
        });
        await channel.watch();
        const aiMessageResponse = await channel.sendMessage({
            text: "",
            user_id: aiUserId,
            custom: {
                Message_type: "ai_response",
            },
        });
        const aiMessage = aiMessageResponse.message;
        if (!aiMessage) {
            throw new Error("Failed to create AI message");
        }
        const handler = new GeminiResponseHandler_1.GeminiResponseHandler(genAI, serverClient_1.serverClient, channel, aiMessage, aiUserId, messageText, () => activeHandlers.delete(aiMessage.id));
        activeHandlers.set(aiMessage.id, handler);
        // Don't await - let it run in background
        handler.run().catch((error) => {
            console.error("AI handler error:", error);
        });
        res.status(200).json({ status: "ok", messageId: aiMessage.id });
    }
    catch (error) {
        console.error("AI reply error:", error);
        res.status(500).json({ error: "Failed to generate AI reply" });
    }
});
app.get("/", (req, res) => {
    res.json({
        message: "AI writing Assistant is running with Gemini!",
        apikey: serverClient_1.apikey,
    });
});
const PORT = process.env.PORT || 3000;
// Recompiling with new routes
ensureAiUser()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port http://localhost:${PORT}`);
        console.log("Using Gemini AI");
    });
})
    .catch((error) => {
    console.error("Failed to initialize AI user:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map