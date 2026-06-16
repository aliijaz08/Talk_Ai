# Git Setup Guide for TalkAI

## Prerequisites
Make sure you have Git installed. You can check by opening Command Prompt and running:
```
git --version
```

If Git is not installed, download it from: https://git-scm.com/download/win

## Option 1: Automatic Setup (Recommended)

1. Double-click `setup-git.bat` in the TalkAI folder
2. Follow the prompts
3. Enter your GitHub credentials if asked

## Option 2: Manual Setup

Open Command Prompt (cmd) in the TalkAI folder and run these commands one by one:

### Step 1: Configure Git (First time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Step 2: Initialize Repository
```bash
git init
```

### Step 3: Add Remote
```bash
git remote add origin https://github.com/aliijaz08/Talk_Ai.git
```

### Step 4: Add Files
```bash
git add .
```

### Step 5: Create Commit
```bash
git commit -m "Initial commit: TalkAI application with React frontend and Node.js backend"
```

### Step 6: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## Troubleshooting

### Authentication Issues
If you get authentication errors, you may need to:
1. Use a Personal Access Token (PAT) instead of password
2. Set up SSH keys
3. Use GitHub Desktop

### Creating a Personal Access Token (if needed):
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use the token as your password when prompted

### Files to Keep Private
The `.gitignore` file is set up to exclude:
- node_modules/
- .env files (keep your API keys private!)
- database files
- build outputs
- user uploads

## After First Push

For future updates, use:
```bash
git add .
git commit -m "Your commit message"
git push
```

## Need Help?
- Check if your repository is public or private on GitHub
- Make sure you have permission to push to the repository
- Verify your GitHub credentials are correct
