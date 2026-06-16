import express, { Response } from "express";
import prisma from "../db/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get all chats for logged-in user
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chats = await prisma.chat.findMany({
            where: { userId: req.userId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 1, // Get first message for preview
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: [
                { isPinned: "desc" }, // Pinned chats first
                { updatedAt: "desc" }, // Then by most recent
            ],
        });

        res.status(200).json({ chats });
    } catch (error) {
        console.error("Get chats error:", error);
        res.status(500).json({ error: "Failed to get chats" });
    }
});

// Get specific chat with all messages
router.get("/:chatId", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;

        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId, // Ensure user owns this chat
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

        res.status(200).json({ chat });
    } catch (error) {
        console.error("Get chat error:", error);
        res.status(500).json({ error: "Failed to get chat" });
    }
});

// Create new chat
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title } = req.body;

        const chat = await prisma.chat.create({
            data: {
                title: title || "New Chat",
                userId: req.userId!,
            },
            include: {
                messages: true,
            },
        });

        res.status(201).json({
            message: "Chat created successfully",
            chat,
        });
    } catch (error) {
        console.error("Create chat error:", error);
        res.status(500).json({ error: "Failed to create chat" });
    }
});

// Update chat title
router.put("/:chatId", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const { title } = req.body;

        if (!title) {
            res.status(400).json({ error: "Title is required" });
            return;
        }

        // Verify ownership
        const existingChat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
        });

        if (!existingChat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        const updatedChat = await prisma.chat.update({
            where: { id: chatId },
            data: { title },
        });

        res.status(200).json({
            message: "Chat updated successfully",
            chat: updatedChat,
        });
    } catch (error) {
        console.error("Update chat error:", error);
        res.status(500).json({ error: "Failed to update chat" });
    }
});

// Toggle pin status
router.patch("/:chatId/pin", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;

        // Verify ownership
        const existingChat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
        });

        if (!existingChat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        const updatedChat = await prisma.chat.update({
            where: { id: chatId },
            data: { isPinned: !existingChat.isPinned },
        });

        res.status(200).json({
            message: updatedChat.isPinned ? "Chat pinned" : "Chat unpinned",
            chat: updatedChat,
        });
    } catch (error) {
        console.error("Toggle pin error:", error);
        res.status(500).json({ error: "Failed to toggle pin" });
    }
});

// Delete chat
router.delete("/:chatId", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;

        // Verify ownership
        const existingChat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
        });

        if (!existingChat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        await prisma.chat.delete({
            where: { id: chatId },
        });

        res.status(200).json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.error("Delete chat error:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// Add message to chat
router.post("/:chatId/messages", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const { role, content } = req.body;

        if (!role || !content) {
            res.status(400).json({ error: "Role and content are required" });
            return;
        }

        if (!["user", "assistant"].includes(role)) {
            res.status(400).json({ error: "Role must be 'user' or 'assistant'" });
            return;
        }

        // Verify ownership
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                userId: req.userId,
            },
        });

        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        const message = await prisma.message.create({
            data: {
                chatId,
                role,
                content,
            },
        });

        // Auto-rename chat based on first user message
        if (role === "user") {
            const messageCount = await prisma.message.count({
                where: { chatId, role: "user" },
            });

            // If this is the first user message and chat title is still "New Chat"
            if (messageCount === 1 && chat.title === "New Chat") {
                const newTitle = content.length > 50 
                    ? content.substring(0, 50) + "..." 
                    : content;
                
                await prisma.chat.update({
                    where: { id: chatId },
                    data: { 
                        title: newTitle,
                        updatedAt: new Date() 
                    },
                });
            } else {
                // Just update timestamp
                await prisma.chat.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() },
                });
            }
        } else {
            // Update chat's updatedAt timestamp for assistant messages
            await prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });
        }

        res.status(201).json({
            message: "Message added successfully",
            data: message,
        });
    } catch (error) {
        console.error("Add message error:", error);
        res.status(500).json({ error: "Failed to add message" });
    }
});

export default router;
