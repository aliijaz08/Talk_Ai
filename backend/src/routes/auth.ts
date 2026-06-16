import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { sendWelcomeEmail } from "../config/email";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Signup endpoint
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            res.status(400).json({ error: "Username, email, and password are required" });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: "Account already exists with this email" });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        // Send welcome email (async, don't wait for it)
        sendWelcomeEmail(user.email, user.username).catch((error) => {
            console.error("Failed to send welcome email:", error);
        });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
            },
        });
    } catch (error: any) {
        console.error("Signup error:", error);
        if (error?.code === "P2002" && error?.meta?.target?.includes("email")) {
            res.status(400).json({ error: "Account already exists with this email" });
            return;
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Login endpoint
router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required" });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

export default router;
