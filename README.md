# Yama - Yet Another Meeting Analyzer

Yama is an AI-powered meeting analysis tool that helps teams extract actionable insights from their customer and technical meetings. It automatically identifies pain points, generates follow-up tasks, and surfaces opportunities for technical solutions.

## Features

- **Automated Transcript Analysis**: Upload meeting transcripts and get instant AI-powered analysis
- **Pain Point Detection**: Automatically identify and categorize customer pain points with urgency scoring
- **Follow-up Management**: Track and manage meeting action items and commitments
- **Opportunity Detection**: Surface relevant technical solution opportunities based on customer needs
- **Historical Analysis**: Track recurring issues and trends across multiple meetings
- **Interactive Dashboard**: Real-time overview of meetings, follow-ups, and insights
- **Dark Mode Support**: Full dark mode support for comfortable viewing

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI GPT-4 for transcript analysis
- **Vector Embeddings**: pgvector for semantic search
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Supabase account
- OpenAI API key

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.sample .env
   ```

2. Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=your-openai-key
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── stores/        # Zustand state management
│   ├── lib/           # Utility functions and API clients
│   ├── types/         # TypeScript type definitions
│   └── context/       # React context providers
├── supabase/
│   ├── functions/     # Edge Functions
│   └── migrations/    # Database migrations
└── public/           # Static assets
```

## Key Features

### Transcript Analysis

- Upload meeting transcripts
- AI-powered analysis identifies:
  - Key discussion topics
  - Customer pain points
  - Action items and follow-ups
  - Technical solution opportunities
  - Meeting participants

### Pain Point Analysis

- Automatic categorization
- Urgency scoring
- Trend detection
- Related solution mapping
- Historical tracking

### Follow-up Management

- Automatic task extraction
- Deadline tracking
- Status updates
- Assignment management
- Completion tracking

### Analytics Dashboard

- Meeting statistics
- Trend visualization
- Pain point tracking
- Follow-up status
- Opportunity insights

## Database Schema

### Core Tables

- `companies`: Customer company information
- `meetings`: Meeting metadata and transcripts
- `pain_points`: Identified customer challenges
- `follow_ups`: Action items and tasks
- `nx_opportunities`: Technical solution matches
- `recurring_issues`: Tracked recurring problems

### Security Features

- Row Level Security (RLS) enabled
- Role-based access control
- Secure authentication flow
- Data isolation between users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.