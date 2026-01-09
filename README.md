# HelpDesk Pro - SaaS Support Ticketing System

A modern, real-time support ticketing system built for small SaaS teams (2-5 support agents). Built with React, TypeScript, Firebase, and integrated with SendGrid and Slack.

![HelpDesk Pro](https://via.placeholder.com/800x400/4f46e5/ffffff?text=HelpDesk+Pro)

## 🚀 Features

### Customer Portal
- **Submit Tickets**: Create support tickets with title, description, priority, and file attachments
- **Real-time Updates**: View ticket status and chat threads with instant updates
- **Auto-Confirmation**: Receive email confirmation with ticket number and ETA upon submission
- **Rating System**: Rate support interactions after ticket resolution

### Support Agent Dashboard
- **Kanban Board**: Visual ticket management with drag-and-drop status updates
- **Inbox View**: List view with advanced filtering by status, priority, and customer
- **Internal Notes**: Add private notes not visible to customers
- **Time Tracking**: Built-in timer to track time spent on each ticket
- **Knowledge Base Search**: Quick access to help articles while responding
- **Auto-Assignment**: Automatic ticket distribution to available agents

### Manager Dashboard
- **Performance Metrics**: Track team response times, closure rates, and CSAT scores
- **SLA Tracking**: Monitor compliance with 24-hour response time commitments
- **Trend Analysis**: Visual charts showing ticket volume and resolution trends
- **Agent Performance**: Individual performance metrics per support agent

### Automation Features
- **Auto-Assign**: Round-robin ticket distribution with load balancing
- **Auto-Close**: Automatically close tickets after 7 days of inactivity
- **SLA Warnings**: Notifications for tickets approaching SLA deadlines
- **Customer Reminders**: Remind customers to respond after 24 hours
- **Slack Integration**: Real-time notifications for new and urgent tickets
- **Email Notifications**: SendGrid integration for customer and agent emails

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Hot Toast** - Notifications
- **@hello-pangea/dnd** - Drag and drop
- **Recharts** - Data visualization
- **date-fns** - Date utilities

### Backend (Firebase)
- **Firestore** - Real-time database
- **Authentication** - Google OAuth
- **Storage** - File attachments
- **Cloud Functions** - Serverless automations

### Integrations
- **SendGrid** - Email delivery
- **Slack** - Team notifications

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- SendGrid account (optional)
- Slack workspace (optional)

### Setup

1. **Clone the repository**
   ```bash
   cd helpdesk-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Create a Firestore database
   - Enable Storage
   - Copy your Firebase config

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

5. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Configure Cloud Functions**
   ```bash
   cd functions
   # Set SendGrid API key (optional)
   firebase functions:config:set sendgrid.api_key="your_sendgrid_key" sendgrid.from_email="support@yourdomain.com"
   
   # Set Slack credentials (optional)
   firebase functions:config:set slack.token="xoxb-your-token" slack.channel="#support-tickets"
   
   # Set app URL for email links
   firebase functions:config:set app.url="https://your-app.firebaseapp.com"
   
   cd ..
   ```

7. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

8. **Deploy to Firebase Hosting**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Development Mode

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Start Firebase emulators (for local testing)**
   ```bash
   firebase emulators:start
   ```

## 🔐 User Roles

### Customer
- Can create and view own tickets
- Can respond to ticket threads
- Can rate resolved tickets
- Cannot access agent/manager areas

### Agent
- Can view all tickets
- Can assign tickets to self
- Can respond and add internal notes
- Can track time on tickets
- Access to knowledge base
- Cannot view manager metrics

### Manager
- All agent permissions
- View team performance metrics
- View SLA compliance data
- Access agent performance reports
- Configure system settings

## 📁 Project Structure

```
helpdesk-pro/
├── src/
│   ├── components/      # Reusable React components
│   │   ├── Layout.tsx
│   │   └── LoadingScreen.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts   # Authentication logic
│   │   └── useTickets.ts # Ticket data management
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   ├── CustomerPortal.tsx
│   │   ├── AgentDashboard.tsx
│   │   └── ManagerDashboard.tsx
│   ├── services/        # Firebase configuration
│   │   └── firebase.ts
│   ├── types/           # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── functions/
│   ├── src/
│   │   └── index.ts     # Cloud Functions
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔧 Configuration

### Firestore Security Rules
The security rules are already configured in `firestore.rules`. Key features:
- Customers can only access their own tickets
- Agents can access all tickets
- Managers have full access
- Cloud Functions bypass all rules

### Initial Setup Steps

1. **Create initial admin/manager account**
   ```javascript
   // Run this in Firebase Console or via a script
   // Set role to 'manager' for the first user
   ```

2. **Seed knowledge base (optional)**
   Add articles to the `knowledgeBase` collection:
   ```json
   {
     "title": "How to Reset Password",
     "content": "Step-by-step guide for password reset...",
     "category": "Account",
     "tags": ["password", "account", "login"]
   }
   ```

3. **Configure agent skills (optional)**
   Add skills array to agent user documents:
   ```json
   {
     "skills": ["billing", "technical", "onboarding"]
   }
   ```

## 📊 Automation Triggers

| Function | Trigger | Description |
|----------|---------|-------------|
| `autoAssignTicket` | `tickets` onCreate | Assigns new tickets to agents |
| `sendTicketConfirmation` | `tickets` onCreate | Sends email confirmation |
| `notifyHighPriorityTicket` | `tickets` onCreate | Slack notification for urgent tickets |
| `autoCloseInactiveTickets` | Scheduled (2 AM) | Closes tickets inactive for 7+ days |
| `slaWarningNotifications` | Scheduled (every 4h) | Warns about approaching SLA deadlines |
| `aggregateDailyMetrics` | Scheduled (11 PM) | Calculates daily statistics |
| `customerReminderNotification` | Scheduled (9 AM) | Reminds customers to respond |
| `updateAgentMetrics` | `tickets` onUpdate | Updates agent performance metrics |

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the color palette:
```javascript
colors: {
  primary: { /* Your primary colors */ },
  accent: { /* Your accent colors */ },
}
```

### Branding
Update the logo and app name in:
- `src/components/Layout.tsx`
- `src/pages/Login.tsx`
- `index.html`

### Email Templates
Customize email templates in `functions/src/index.ts`:
- `sendTicketConfirmation`
- `slaWarningNotifications`
- `customerReminderNotification`

## 🚨 Troubleshooting

### Common Issues

1. **Authentication errors**
   - Ensure Google Auth is enabled in Firebase Console
   - Check that the authorized domains include your domain

2. **Email not sending**
   - Verify SendGrid API key is set in Firebase config
   - Check SendGrid account for restrictions

3. **Slack notifications not working**
   - Verify Slack Bot Token has required permissions
   - Ensure the channel exists and bot has access

4. **Cloud Functions deployment fails**
   - Ensure Node.js version is 18 in `package.json`
   - Check Firebase quota limits

### Logs
View Cloud Functions logs:
```bash
firebase functions:log
```

## 📝 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue or contact support@helpdeskpro.com

---

Built with ❤️ for SaaS teams
