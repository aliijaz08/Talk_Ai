# Email Configuration Guide

## Setup Instructions

To enable welcome emails for new user registrations, you need to configure SMTP email settings in your `.env` file.

### Required Environment Variables

Add these variables to your `backend/.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-here"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:5500"
```

## Using Gmail

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

### Step 2: Create App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** and **Other (Custom name)**
3. Enter "TalkAI" as the name
4. Click **Generate**
5. Copy the 16-character password (remove spaces)
6. Use this password in `SMTP_PASS`

### Step 3: Update .env File
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="youremail@gmail.com"
SMTP_PASS="your-16-char-app-password"
FRONTEND_URL="http://localhost:5500"
```

## Using Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

### Yahoo
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
```

### Custom SMTP Server
```env
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"
SMTP_SECURE="false"  # Set to "true" for port 465
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

## Install Dependencies

After adding nodemailer to package.json, install it:

```bash
cd backend
npm install
```

## Testing

1. Restart your server:
   ```bash
   npm start
   ```

2. Register a new user account

3. Check the email inbox for the welcome email

## Troubleshooting

### Email not sending?
- Check server console for error messages
- Verify SMTP credentials are correct
- Ensure 2-Step Verification and App Password are set up (for Gmail)
- Check spam/junk folder

### Common Errors

**"Invalid login"**: 
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, make sure you're using an App Password, not your regular password

**"Connection timeout"**: 
- Check SMTP_HOST and SMTP_PORT
- Verify firewall isn't blocking outgoing SMTP connections

**"Authentication failed"**:
- Double-check your email provider's SMTP settings
- Ensure App Password is enabled (Gmail/Yahoo)

## Email Template

The welcome email includes:
- ✨ TalkAI branding
- Welcome message with username
- Feature highlights
- Call-to-action button to start chatting
- Professional HTML and plain text versions

You can customize the email template in `src/config/email.ts`
