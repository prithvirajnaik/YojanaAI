# YojanaAI 🇮🇳

**AI-Powered Government Scheme Recommendation System**

YojanaAI is an intelligent web application that helps Indian citizens discover government schemes they're eligible for using natural language queries and AI-powered assistance.

## 🌟 Features

- **Smart Search**: Natural language processing to understand user profiles
- **AI-Powered Chat**: Ask questions about schemes using Google's Gemini AI
- **Instant Eligibility**: Know if you qualify immediately
- **Pan-India Coverage**: Access schemes from Central and State Governments
- **PDF Export**: Download scheme details with required documents
- **Modern UI**: Beautiful, responsive interface with dark mode

## 🏗️ Architecture

### Backend (`yojana-backend`)
- **Framework**: Express.js (Node.js)
- **Search Engine**: Fuse.js for fuzzy matching
- **AI Integration**: Google Gemini API
- **Data**: 3400+ parsed government schemes

### Frontend (`yojana-frontend`)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **UI**: ChatGPT-style interface with scheme cards

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd yojanai/samvidhan
```

### 2. Backend Setup

```bash
cd yojana-backend

# Install dependencies
npm install

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the server
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd ../yojana-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔑 Environment Variables

### Backend (`.env`)
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### Frontend (`.env`)
```env
VITE_API_BASE=http://localhost:3000
```

## 📡 API Endpoints

### `POST /recommend`
Get scheme recommendations based on user profile.

**Request:**
```json
{
  "text": "I am a 21 year old female student from Karnataka with income 2 lakh"
}
```

**Response:**
```json
{
  "strict": true,
  "count": 15,
  "items": [...schemes],
  "user": {...parsed_profile}
}
```

### `POST /ai-chat`
Ask AI questions about schemes.

**Request:**
```json
{
  "query": "Am I eligible for this scheme?",
  "schemeContext": {...scheme_details},
  "userProfile": {...user_details}
}
```

**Response:**
```json
{
  "answer": "Based on the scheme details..."
}
```

### `GET /scheme/:slug`
Get details of a specific scheme.

### `GET /pdf/:slug`
Download scheme details as PDF.

## 🎯 Usage Example

1. **Navigate to the app**: Open `http://localhost:5173`
2. **Go to Chat**: Click "Get Started" on the landing page
3. **Describe yourself**: 
   ```
   I am a 21 year old female student from Karnataka with income 2 lakh
   ```
4. **View Results**: Browse recommended schemes
5. **Ask AI**: Click on any scheme and use "Ask YojanaAI" to:
   - Get a summary
   - Check eligibility
   - Ask about documents

## 🗂️ Project Structure

```
samvidhan/
├── yojana-backend/
│   ├── server.js          # Main Express server
│   ├── utils.js           # Helper functions
│   ├── validator.js       # Input validation
│   ├── output/
│   │   └── schemes_parsed.json  # Scheme database
│   └── package.json
│
├── yojana-frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── api.js         # API client
│   │   ├── components/    # React components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── SchemeCard.jsx
│   │   │   └── SchemeModal.jsx
│   │   └── pages/         # Page components
│   │       ├── LandingPage.jsx
│   │       └── ChatPage.jsx
│   └── package.json
│
└── covert_and_parse.py    # Data processing script
```

## 🧠 How It Works

### 1. **User Input Parsing**
The system extracts:
- Age
- Gender
- State
- Income
- Tags (student, farmer, etc.)

### 2. **Fuzzy Search**
Uses Fuse.js to find relevant schemes based on keywords.

### 3. **Strict Filtering**
Filters by:
- Income limits
- State/scope
- Gender requirements

### 4. **Smart Scoring**
Ranks schemes based on:
- Keyword matches (student, farmer, etc.)
- Target group alignment
- State relevance
- Income compatibility

### 5. **AI Enhancement**
Gemini AI provides:
- Scheme summaries
- Eligibility explanations
- Document guidance

## 🛠️ Technologies Used

**Backend:**
- Express.js
- Fuse.js (fuzzy search)
- Google Generative AI SDK
- PDFKit (PDF generation)
- dotenv

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Fetch API

## 📊 Data

The system contains **3400+ government schemes** parsed from official sources, including:
- Scheme name and details
- Eligibility criteria
- Benefits
- Required documents
- Application process
- Official URLs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## 🙏 Acknowledgments

- Government of India for scheme data
- Google Gemini for AI capabilities
- MyScheme.gov.in for scheme information

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for Indian Citizens**
