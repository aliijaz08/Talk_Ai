# TalkAI

An AI-powered chat application with support for multiple AI providers (OpenAI and Google Gemini).

## Features

- 🤖 Multi-AI Provider Support (OpenAI, Google Gemini)
- 💬 Real-time Chat Interface
- 👤 User Authentication & Profiles
- 📁 File Attachments Support
- 🎨 Modern React Frontend
- 🔒 Secure Backend with JWT Authentication

## Tech Stack

### Frontend
- React 18
- React Router v6
- Context API for state management

### Backend
- Node.js with TypeScript
- Express.js
- Prisma ORM
- SQLite Database
- JWT Authentication
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/aliijaz08/Talk_Ai.git
cd Talk_Ai
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend-react
npm install
```

4. Set up environment variables
```bash
cd ../backend
cp .env.example .env
# Edit .env with your API keys and configuration
```

5. Run database migrations
```bash
npx prisma migrate dev
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend (in a new terminal)
```bash
cd frontend-react
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

## Project Structure

```
TalkAI/
├── backend/              # Backend Node.js application
│   ├── src/             # TypeScript source files
│   ├── dist/            # Compiled JavaScript
│   ├── prisma/          # Database schema and migrations
│   └── uploads/         # User uploaded files
└── frontend-react/      # React frontend application
    ├── src/
    │   ├── pages/       # Page components
    │   ├── context/     # React context providers
    │   └── utils/       # Utility functions
    └── public/          # Static files
```

## License

MIT

## Author

Ali Ijaz
