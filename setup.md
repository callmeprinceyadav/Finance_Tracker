# Quick Setup Guide

## Prerequisites
1. Install Node.js (v16 or higher) from https://nodejs.org/
2. Install MongoDB Community Edition or use MongoDB Atlas
3. Get a Google Gemini API key from https://aistudio.google.com/app/apikey

## Setup Steps

### 1. Backend Setup
```bash
cd backend
npm install
```

Edit the `.env` file and add your Gemini API key:
```
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup (in a new terminal)
```bash
cd frontend
npm install
npm start
```

### 3. Test the Application
1. Open http://localhost:3000 in your browser
2. Go to the "Upload Statement" tab
3. Upload one of the sample files from `sample-statements/`
4. Watch the AI parse your transactions automatically!

## Sample Files to Test
- `sample-statements/sample_bank_statement.csv` - CSV format
- `sample-statements/sample_statement.txt` - Text format

## Troubleshooting
- Make sure MongoDB is running locally or update MONGO_URI in backend/.env
- Verify your Gemini API key is correct
- Check that both servers are running (backend on :5000, frontend on :3000)
