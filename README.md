# Yama - Your Friendly Meeting Assistant 🐱

<p align="center">
  <img src="/public/assets/yama-face.png" alt="Yama Logo" width="150" />
</p>

> **:white_check_mark: This app is fully deployed and ready to use!**
>
> - The Supabase database is set up and requires no further configuration.
> - The project is under the `nrwl` org on GitHub and is connected to the Nx Netlify account. Netlify auto-deploys on every push to `main`.
> - Jack can help with Netlify settings if needed.
> - Steve configured the URL for Google OAuth, which is also set up correctly.
> - All required environment variables are already in place in Netlify.
>
> **If you ever want to set up the project from scratch, see the [Contributing & Onboarding Guide](./CONTRIBUTING.md).**

Yama (Yet Another Meeting Analyzer) is an intelligent meeting analysis tool specifically designed for the Nx team. It helps you extract valuable insights from your meeting transcripts and turn them into actionable items.

> **Note**: This application is restricted to @nrwl.io email addresses only. Access is managed through Google Authentication as part of the Nx Google Cloud platform.

## Features

### Meeting Analysis

- Submit meeting transcripts and get AI-powered analysis of:
  - Key discussion points and decisions
  - Action items and follow-ups
  - Technical challenges and pain points
  - Potential Nx solution opportunities
  - Meeting sentiment and engagement levels
  - Participant roles and contributions

### Company Management

- Track and manage company-specific meeting data and insights
- View company profile with meeting history
- Track recurring issues and opportunities
- Monitor engagement and relationship health

### Follow-up Tracking

- Automated extraction of action items
- Due date tracking and reminders
- Status updates and progress monitoring
- Assignment management
- Email notification system

### Pain Points Analysis

- Automatic categorization of technical challenges
- Urgency and impact scoring
- Trend detection across meetings
- Related Nx solution mapping
- Historical tracking and resolution status

### Opportunity Tracking

- Identify potential Nx solution opportunities
- Track opportunity stages and progress
- Link opportunities to specific pain points
- Monitor opportunity value and probability
- Generate opportunity reports

### Historical Data

- Access and analyze historical meeting data
- Track trends and patterns
- Generate insights reports
- Export data for further analysis

## Pages and Navigation

- **Dashboard**: Overview of recent meetings, pending follow-ups, and key metrics
- **Submit Transcript**: Form to submit new meeting transcripts for analysis
- **Analysis Results**: Detailed view of meeting analysis with actionable insights
- **Historical Data**: Timeline and trends of past meetings and insights
- **Follow-ups**: Task management and tracking system
- **Companies**: Company profiles and meeting history
- **Pain Points**: Tracking and analysis of technical challenges
- **Opportunities**: Pipeline of potential Nx solution opportunities
- **Admin Dashboard**: System management and configuration (admin only)

## Meeting Types Supported

- Initial Consultations
- Technical Reviews
- Follow-up Meetings
- Product Demos
- Training Sessions

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Technology Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Backend & Authentication)
- React Router
- React Hook Form

## Future Enhancements

### Planned Features

- **Gong Integration**: Automatic meeting transcript syncing
- **User Role Management**:
  - Admin: Full system access
  - Manager: Team oversight and reporting
  - User: Standard meeting analysis access

### Potential Improvements

- Custom dashboard widgets
- Add notes for each meeting
- Export functionality for reports
- API access for external tools
- Meeting templates and best practices
- Automated follow-up email generation
- Integration with project management tools

## Contributing

This project is part of the Nx ecosystem. Please refer to our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
