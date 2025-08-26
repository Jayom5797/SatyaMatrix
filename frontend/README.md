# Misinformation Detection Chatbot

A React + TypeScript + Vite application for detecting and reporting misinformation through an AI-powered chatbot interface.

## Features

### Chat Interface
- **AI Assistant (MICK)**: Interactive chatbot that analyzes news content for reliability
- **Multi-input Support**: Text input, voice recording, and file attachments
- **Real-time Analysis**: Provides reliability scores for submitted content
- **Modal Publishing**: When fake news is detected (reliability < 60%), users can publish reports to the community

### Trending Virals Page
- **Community Reports**: View all published misinformation reports
- **Voting System**: Upvote/downvote reports based on accuracy
- **Filtering**: Filter by categories (Health, Politics, Celebrity, Technology)
- **Detailed Analysis**: See reasons why content was flagged as misinformation
- **Reporting**: Report inappropriate content

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the provided localhost URL

## Project Structure

```
src/
├── components/
│   ├── ChatPage.tsx          # Main chat interface
│   ├── ChatPage.css          # Chat interface styles
│   ├── TrendingPage.tsx      # Trending misinformation reports
│   └── TrendingPage.css      # Trending page styles
├── App.tsx                   # Main app with routing
├── App.css                   # Global styles and navigation
└── main.tsx                  # App entry point
```

## Dependencies

- **React 19.1.1**: UI framework
- **React Router DOM**: Client-side routing
- **Lucide React**: Icon library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

## Usage

1. **Chat Interface**: 
   - Type messages or use voice input to submit news content
   - Attach images or files for analysis
   - View reliability scores and analysis results
   - Publish low-reliability content to community reports

2. **Trending Page**:
   - Browse community-reported misinformation
   - Vote on report accuracy
   - Filter by content categories
   - Report inappropriate content

## Development

The application uses modern React patterns with TypeScript for type safety. All components are fully responsive and include proper error handling.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
