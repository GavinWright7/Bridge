# Bridge - AI-Powered Career Development Platform

A full-stack web application that helps users discover their ideal career path, upload documents, and get personalized learning plans powered by OpenAI.

## Features

### 🎯 Smart Career Matching
- Interactive salary range slider ($30k-$200k)
- Bubble checkbox selections for activities and skills
- **AI-powered career recommendations** using OpenAI GPT
- Personalized job matching based on user preferences

### 📄 Document Upload & Analysis
- Resume and transcript upload (PDF/DOC support)
- Drag-and-drop file interface
- File validation and storage
- Document analysis for learning plan generation

### 📚 Personalized Learning Plans
- **AI-generated 30-day learning curricula** tailored to career goals
- Multi-modal learning content:
  - 📖 Interactive readings with Markdown support
  - 🎥 Video lessons (placeholder for actual video content)
  - 🧠 Interactive quizzes with immediate feedback
  - 🎮 Embedded HTML5 learning games
- Progress tracking with localStorage persistence
- Responsive design for all devices

### 🤖 OpenAI Integration
- **Real-time career recommendations** based on user profile
- **Custom learning plan generation** considering user background
- Intelligent content adaptation for different career paths
- Fall-back to mock data for development/testing

## Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Markdown** for rich text rendering

### Backend
- **Node.js** with Express.js
- **OpenAI API** integration for AI features
- **Multer** for file upload handling
- **CORS** enabled for cross-origin requests
- **dotenv** for environment variable management

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5001`
   - Frontend React app on `http://localhost:3000`

## API Endpoints

### Core Endpoints
- `GET /api/health` - Health check and OpenAI status
- `GET /api/jobs` - Get available jobs
- `GET /api/learning-plans` - Get learning plans

### AI-Powered Endpoints
- `POST /api/career-recommendations` - Generate AI career recommendations
  ```json
  {
    "salary": 80000,
    "activities": ["Building things", "Solving problems"],
    "skills": ["JavaScript", "Python"]
  }
  ```

- `POST /api/generate-learning-plan` - Generate personalized learning plan
  ```json
  {
    "selectedJob": {
      "title": "Frontend Developer",
      "description": "...",
      "requiredSkills": ["JavaScript", "React"]
    },
    "resumeFile": "filename.pdf",
    "transcriptFile": "transcript.pdf"
  }
  ```

### File Upload Endpoints
- `POST /api/upload-resume` - Upload resume file
- `POST /api/upload-transcript` - Upload transcript file

## User Journey

1. **Home Page** - Users set salary preferences and select skills/activities
2. **Jobs Page** - AI generates personalized career recommendations
3. **Upload Page** - Users upload resume and transcript
4. **Learn Page** - AI creates custom 30-day learning plan with:
   - Daily 5-minute lessons
   - Mixed content types (reading, video, quiz, game)
   - Progress tracking
   - Career-specific curriculum

## Development Features

- **Hot reload** for both frontend and backend
- **ESLint** integration for code quality
- **Responsive design** with mobile-first approach
- **Error handling** with user-friendly messages
- **Loading states** for better UX
- **File validation** for uploads
- **Progress persistence** with localStorage

## OpenAI Integration Details

The application uses OpenAI's GPT-3.5-turbo model for:

1. **Career Recommendations**: Analyzes user preferences to suggest relevant career paths
2. **Learning Plan Generation**: Creates personalized curricula based on career goals and user background
3. **Content Adaptation**: Tailors learning materials to specific job requirements

The system includes intelligent fallbacks to ensure functionality even if the OpenAI API is unavailable.

## File Structure

```
Bridge/
├── package.json                 # Root package configuration
├── backend/
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Main server file with OpenAI integration
│   ├── .env                    # Environment variables (not in git)
│   └── uploads/                # File upload storage
├── frontend/
│   ├── package.json            # Frontend dependencies
│   ├── src/
│   │   ├── App.js              # Main React app
│   │   ├── components/
│   │   │   └── Navbar.js       # Navigation component
│   │   └── pages/
│   │       ├── Home.js         # Landing page with preferences
│   │       ├── Jobs.js         # AI career recommendations
│   │       ├── Upload.js       # File upload interface
│   │       └── Learn.js        # Learning plan interface
│   └── public/
│       ├── games/              # Interactive learning games
│       └── readings/           # Learning materials
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Environment Variables

Required environment variables for the backend:

- `PORT` - Server port (default: 5001)
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

## License

This project is licensed under the MIT License.

## Next Steps / Future Enhancements

- [ ] Add user authentication and profiles
- [ ] Implement real video content delivery
- [ ] Add more interactive learning games
- [ ] Include progress analytics and reporting
- [ ] Add social features (sharing progress, competitions)
- [ ] Integrate with job boards for real job listings
- [ ] Add mobile app version
- [ ] Implement advanced AI features (interview prep, skill assessment) 