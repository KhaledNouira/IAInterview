# AI Interview Simulator

An AI-powered job interview simulation web app with voice interaction and performance feedback.

## Features

- **Job Description Analysis**: Upload or paste job descriptions to generate tailored interview questions.
- **Voice-Enabled Interviews**: Interact with the AI interviewer using voice commands and responses.
- **Real-time Feedback**: Receive instant feedback on your answers during the interview.
- **Comprehensive Reports**: Get detailed performance reports highlighting strengths and areas for improvement.
- **Progress Tracking**: Track your interview performance over time with user accounts.

## Architecture

The application uses a modern full-stack JavaScript architecture:

- **Frontend**: React with TypeScript, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js server with RESTful API endpoints
- **Storage**: In-memory storage with TypeScript interfaces
- **Authentication**: Passport.js with session-based authentication

## Text-to-Speech Implementation

The application currently uses a hybrid approach for text-to-speech:

1. **Server-Side Processing**: Text is processed on the server for improved formatting and structure.
2. **Client-Side Synthesis**: The browser's Web Speech API is used to generate speech.
3. **Fallback Mechanism**: If server processing fails, the app falls back to direct browser synthesis.

### Future Integration Potential

The app is designed to easily integrate with more advanced TTS solutions:

- **Dia 1.6B Model**: See `server/dia-integration.md` for details on how to integrate the Dia model.
- **OpenAI TTS API**: Could be integrated for high-quality voice synthesis.
- **Other TTS Services**: The architecture supports easy integration with various TTS services.

## Getting Started

1. **Installation**:
   ```bash
   npm install
   ```

2. **Running the Application**:
   ```bash
   npm run dev
   ```

3. **Accessing the App**:
   Open your browser and navigate to `http://localhost:5000`

## Usage Guide

1. **Register or Log In**: Create an account or log in to access the application.
2. **Create a New Interview**: Upload a job description or enter details manually.
3. **Start the Interview**: Begin the voice-based interview session.
4. **Answer Questions**: Respond to AI-generated questions using your microphone.
5. **Review Feedback**: Get instant feedback and a comprehensive report at the end.

## Technical Details

- The application uses browser's SpeechSynthesis API for TTS and SpeechRecognition API for STT.
- Interview questions are generated based on job description analysis.
- Performance evaluation uses a sophisticated scoring algorithm analyzing response content and delivery.

## Troubleshooting

- **Browser Compatibility**: For best results, use Google Chrome or Microsoft Edge.
- **Microphone Access**: Ensure your browser has permission to access your microphone.
- **Voice Recognition**: Speak clearly and at a moderate pace for best recognition results.