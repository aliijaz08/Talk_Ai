"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../db/prisma"));
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Get user profile
router.get("/profile", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Failed to get profile" });
    }
});
// Update user profile
router.put("/profile", auth_1.authMiddleware, async (req, res) => {
    try {
        const { username, bio } = req.body;
        // Check if username is already taken by another user
        if (username) {
            const existingUser = await prisma_1.default.user.findFirst({
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
        const updatedUser = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});
// Upload profile picture
router.post("/profile/picture", auth_1.authMiddleware, multer_1.uploadProfilePicture.single("profilePicture"), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        // Get old profile picture to delete it
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            select: { profilePicture: true },
        });
        // Delete old profile picture if exists
        if (user?.profilePicture) {
            const oldFilePath = path_1.default.join(__dirname, "..", "..", user.profilePicture);
            if (fs_1.default.existsSync(oldFilePath)) {
                fs_1.default.unlinkSync(oldFilePath);
            }
        }
        // Update user with new profile picture path
        const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
        const updatedUser = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error("Upload profile picture error:", error);
        res.status(500).json({ error: "Failed to upload profile picture" });
    }
});
// Delete profile picture
router.delete("/profile/picture", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            select: { profilePicture: true },
        });
        if (!user?.profilePicture) {
            res.status(404).json({ error: "No profile picture to delete" });
            return;
        }
        // Delete file from filesystem
        const filePath = path_1.default.join(__dirname, "..", "..", user.profilePicture);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Update user to remove profile picture
        const updatedUser = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error("Delete profile picture error:", error);
        res.status(500).json({ error: "Failed to delete profile picture" });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map