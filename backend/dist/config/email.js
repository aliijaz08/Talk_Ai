"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};
// Create transporter
const transporter = nodemailer_1.default.createTransport(emailConfig);
// Verify connection configuration (only if credentials are provided)
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify((error, success) => {
        if (error) {
            console.error("Email service configuration error:", error);
        }
        else {
            console.log("Email service is ready to send emails");
        }
    });
}
else {
    console.log("Email service not configured (SMTP credentials missing). Emails will not be sent.");
}
// Send welcome email
async function sendWelcomeEmail(to, username) {
    const mailOptions = {
        from: `"TalkAI" <${process.env.SMTP_USER}>`,
        to,
        subject: "Welcome to TalkAI! 🎉",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 10px 10px 0 0;
                        text-align: center;
                    }
                    .logo {
                        font-size: 48px;
                        margin-bottom: 10px;
                    }
                    .content {
                        background: #ffffff;
                        padding: 30px;
                        border: 1px solid #E5E7EB;
                        border-top: none;
                    }
                    .welcome-text {
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        color: #1F2937;
                    }
                    .features {
                        background: #F9FAFB;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .feature-item {
                        margin: 10px 0;
                        padding-left: 25px;
                        position: relative;
                    }
                    .feature-item:before {
                        content: "✓";
                        position: absolute;
                        left: 0;
                        color: #10B981;
                        font-weight: bold;
                    }
                    .cta-button {
                        display: inline-block;
                        background: #6366F1;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: 600;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        color: #6B7280;
                        font-size: 14px;
                        border-top: 1px solid #E5E7EB;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">✨</div>
                    <h1 style="margin: 0;">TalkAI</h1>
                </div>
                <div class="content">
                    <p class="welcome-text">Welcome, ${username}!</p>
                    <p>Thank you for joining TalkAI! We're excited to have you on board.</p>
                    <p>Your account has been successfully created, and you're ready to start having intelligent conversations with our AI assistant.</p>
                    
                    <div class="features">
                        <h3 style="margin-top: 0; color: #1F2937;">What you can do with TalkAI:</h3>
                        <div class="feature-item">Ask questions and get instant answers</div>
                        <div class="feature-item">Have natural, flowing conversations</div>
                        <div class="feature-item">Save and organize your chat history</div>
                        <div class="feature-item">Access your chats from anywhere</div>
                        <div class="feature-item">Customize your profile and preferences</div>
                    </div>
                    
                    <p>Ready to get started? Log in to your account and begin your first conversation!</p>
                    
                    <center>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}" class="cta-button">
                            Start Chatting
                        </a>
                    </center>
                    
                    <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
                        If you have any questions or need help, feel free to reach out to us.
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} TalkAI. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </body>
            </html>
        `,
        text: `
Welcome to TalkAI, ${username}!

Thank you for joining TalkAI! We're excited to have you on board.

Your account has been successfully created, and you're ready to start having intelligent conversations with our AI assistant.

What you can do with TalkAI:
✓ Ask questions and get instant answers
✓ Have natural, flowing conversations
✓ Save and organize your chat history
✓ Access your chats from anywhere
✓ Customize your profile and preferences

Ready to get started? Log in to your account and begin your first conversation!

Visit: ${process.env.FRONTEND_URL || 'http://localhost:5500'}

If you have any questions or need help, feel free to reach out to us.

© ${new Date().getFullYear()} TalkAI. All rights reserved.
This is an automated message. Please do not reply to this email.
        `.trim(),
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to}`);
    }
    catch (error) {
        console.error("Error sending welcome email:", error);
        // Don't throw error - email failure shouldn't block registration
    }
}
exports.default = transporter;
//# sourceMappingURL=email.js.map