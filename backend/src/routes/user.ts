import express, { Response } from "express";
import prisma from "../db/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { uploadProfilePicture } from "../config/multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Get user profile
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Failed to get profile" });
    }
});

// Update user profile
router.put("/profile", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, bio } = req.body;

        // Check if username is already taken by another user
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: req.userId },
                },
            });

            if (existingUser) {
                res.status(400).json({ error: "Username already taken" });
                return;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(username && { username }),
                ...(bio !== undefined && { bio }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
            },
        });

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Upload profile picture
router.post(
    "/profile/picture",
    authMiddleware,
    uploadProfilePicture.single("profilePicture"),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }

            // Get old profile picture to delete it
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: { profilePicture: true },
            });

            // Delete old profile picture if exists
            if (user?.profilePicture) {
                const oldFilePath = path.join(__dirname, "..", "..", user.profilePicture);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Update user with new profile picture path
            const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
            const updatedUser = await prisma.user.update({
                where: { id: req.userId },
                data: { profilePicture: profilePicturePath },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profilePicture: true,
                    bio: true,
                },
            });

            res.status(200).json({
                message: "Profile picture uploaded successfully",
                user: updatedUser,
            });
        } catch (error) {
            console.error("Upload profile picture error:", error);
            res.status(500).json({ error: "Failed to upload profile picture" });
        }
    }
);

// Delete profile picture
router.delete("/profile/picture", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { profilePicture: true },
        });

        if (!user?.profilePicture) {
            res.status(404).json({ error: "No profile picture to delete" });
            return;
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, "..", "..", user.profilePicture);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Update user to remove profile picture
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { profilePicture: null },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
            },
        });

        res.status(200).json({
            message: "Profile picture deleted successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Delete profile picture error:", error);
        res.status(500).json({ error: "Failed to delete profile picture" });
    }
});

export default router;
