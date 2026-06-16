import cors from "cors";
import "dotenv/config";
import express from "express";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import type { Event } from "stream-chat";
import { GeminiResponseHandler } from "./agents/gemini/GeminiResponseHandler";
import { apikey, serverClient } from "./serverClient";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import chatRoutes from "./routes/chat";
import aiRoutes from "./routes/ai";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY as string | undefined;

const aiUserId = process.env.AI_USER_ID ?? "ai-bot";
const aiUserName = process.env.AI_USER_NAME ?? "AI Assistant";

if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY must be set in environment variables");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const activeHandlers = new Map<string, GeminiResponseHandler>();

const ensureAiUser = async () => {
    await serverClient.upsertUser({
        id: aiUserId,
        name: aiUserName,
        role: "user",
    });
};

const reactBuildDir = path.join(__dirname, "..", "..", "frontend-react", "build");
const legacyFrontendDir = path.join(__dirname, "..", "..", "frontend");
const publicDir = fs.existsSync(reactBuildDir) ? reactBuildDir : legacyFrontendDir;
app.use("/app", express.static(publicDir));

console.log("Serving frontend from:", publicDir);

// Serve uploaded files
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

console.log("Serving uploads from:", uploadsDir);

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/ai", aiRoutes);

app.post("/token", express.json(), async (req, res) => {
    const { userId, name, channelId } = req.body as { userId?: string; name?: string; channelId?: string };
    if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
    }

    // Sanitize userId: replace invalid chars with hyphens, only allow a-z, 0-9, @, _, -
    const sanitizedUserId = userId.toLowerCase().replace(/[^a-z0-9@_-]/g, '-');

    try {
        await serverClient.upsertUser({
            id: sanitizedUserId,
            name: name ?? userId,
            role: "user",
        });

        const token = serverClient.createToken(sanitizedUserId);

        // If channelId provided, create channel and add user as member
        if (channelId) {
            try {
                const channel = serverClient.channel("messaging", channelId, {
                    created_by_id: sanitizedUserId,
                });
                await channel.create();
                await channel.addMembers([sanitizedUserId, aiUserId]);
            } catch (error) {
                // Channel might already exist, that's okay
                console.log("Channel setup:", error);
            }
        }

        res.status(200).json({
            token,
            apiKey: apikey,
            userId: sanitizedUserId,
            name: name ?? userId,
        });
    } catch (error) {
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
        const channel = serverClient.channel(channelType || "messaging", channelId, {
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

        const handler = new GeminiResponseHandler(
            genAI,
            serverClient,
            channel,
            aiMessage,
            aiUserId,
            messageText,
            () => activeHandlers.delete(aiMessage.id)
        );
        activeHandlers.set(aiMessage.id, handler);

        // Don't await - let it run in background
        handler.run().catch((error) => {
            console.error("AI handler error:", error);
        });

        res.status(200).json({ status: "ok", messageId: aiMessage.id });
    } catch (error) {
        console.error("AI reply error:", error);
        res.status(500).json({ error: "Failed to generate AI reply" });
    }
});

app.get("/", (req, res) => {
    res.json({
        message: "AI writing Assistant is running with Gemini!",
        apikey: apikey,
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
