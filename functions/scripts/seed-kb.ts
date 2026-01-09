import { db } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const knowledgeBaseArticles = [
  {
    title: "How to Reset Your Password",
    content: `If you've forgotten your password or need to reset it for security reasons, follow these steps:

1. Go to the login page and click "Forgot Password"
2. Enter your email address associated with your account
3. Check your email for a password reset link
4. Click the link and create a new password
5. Your new password must be at least 8 characters and include a number and special character

If you don't receive an email within 5 minutes, check your spam folder or contact support.`,
    category: "Account",
    tags: ["password", "reset", "login", "security", "account"],
  },
  {
    title: "Understanding Your Billing Cycle",
    content: `Your billing cycle starts on the day you first subscribed and renews automatically on the same date each month or year, depending on your plan.

**Key points about billing:**

- You can view your invoices anytime in Settings > Billing
- Payment is processed automatically on your renewal date
- If payment fails, we'll retry 3 times before suspending your account
- You can update your payment method at any time

**Changing your plan:**

When you upgrade, you'll be charged the prorated difference immediately. When you downgrade, the new rate takes effect at your next renewal.`,
    category: "Billing",
    tags: ["billing", "payment", "invoice", "subscription", "pricing"],
  },
  {
    title: "Getting Started with Your New Account",
    content: `Welcome! Here's how to get started with your new account:

**Step 1: Complete Your Profile**
- Add your profile photo
- Set your display name
- Add your contact information

**Step 2: Invite Your Team**
- Go to Settings > Team Members
- Click "Invite Members"
- Enter email addresses and select roles

**Step 3: Configure Your Workspace**
- Set up your notification preferences
- Connect integrations (Slack, GitHub, etc.)
- Customize your dashboard

**Step 4: Import Data**
- Export data from your old system
- Use our import tool to migrate
- Verify all data transferred correctly

Need help? Our support team is here 24/7!`,
    category: "Getting Started",
    tags: ["onboarding", "setup", "getting started", "profile", "team"],
  },
  {
    title: "How to Export Your Data",
    content: `You can export your data at any time for backup or migration purposes.

**To export your data:**

1. Go to Settings > Data & Privacy
2. Click "Export Data"
3. Select the data types you want to export:
   - Tickets and conversations
   - User data
   - Reports and analytics
   - Knowledge base articles
4. Click "Generate Export"
5. Download your export file (available for 7 days)

**Export formats:**
- Tickets: JSON, CSV
- Reports: PDF, Excel
- Knowledge base: Markdown, HTML

Large exports may take up to 24 hours to generate.`,
    category: "Data & Privacy",
    tags: ["export", "data", "backup", "download", "migration"],
  },
  {
    title: "Understanding User Roles and Permissions",
    content: `We offer three user roles with different permission levels:

**Customer**
- Create and view own tickets
- Respond to ticket threads
- Rate support interactions
- Cannot access admin areas

**Agent**
- View and manage all tickets
- Respond to customers
- Add internal notes
- Access knowledge base
- Cannot view analytics

**Manager**
- All agent permissions
- View team performance metrics
- Configure system settings
- Manage team members
- Access billing and reports

**Custom roles** are available on Enterprise plans. Contact sales for more information.`,
    category: "Account",
    tags: ["roles", "permissions", "users", "team", "admin", "security"],
  },
  {
    title: "Troubleshooting Login Issues",
    content: `Having trouble logging in? Try these solutions:

**1. Check your credentials**
- Make sure you're using the correct email
- Check for typos in your password
- Passwords are case-sensitive

**2. Clear your browser cache**
- Clear cookies and cache
- Try incognito/private mode
- Disable browser extensions

**3. Try a different browser**
- Switch to Chrome, Firefox, or Safari
- Make sure your browser is up to date

**4. Check if your account is locked**
- After 5 failed attempts, accounts are locked for 30 minutes
- Use "Forgot Password" to unlock

**5. Contact support**
- If none of the above works, we're here to help
- Include your email and any error messages`,
    category: "Account",
    tags: ["login", "password", "troubleshooting", "access", "authentication"],
  },
  {
    title: "How to Integrate with Slack",
    content: `Connect your HelpDesk Pro account with Slack to receive notifications and respond to tickets without leaving Slack.

**Setup steps:**

1. Go to Settings > Integrations
2. Find Slack and click "Connect"
3. Authorize the app in Slack
4. Select the channel for notifications

**Available features:**

- New ticket notifications
- Customer reply alerts
- SLA warning notifications
- Agent mentions
- Inline ticket previews

**Commands in Slack:**
- /ticket - Search for a ticket
- /status - View your open tickets
- /help - Get help with Slack integration

Disconnect anytime from Settings > Integrations.`,
    category: "Integrations",
    tags: ["slack", "integration", "notifications", "chat", "team"],
  },
  {
    title: "API Documentation Overview",
    content: `Our REST API allows you to programmatically interact with your HelpDesk Pro data.

**Base URL:**
\`https://api.helpdeskpro.com/v1\`

**Authentication:**
Include your API key in the header:
\`Authorization: Bearer YOUR_API_KEY\`

**Common endpoints:**

**Tickets:**
- GET /tickets - List all tickets
- POST /tickets - Create a ticket
- GET /tickets/:id - Get ticket details
- PATCH /tickets/:id - Update ticket
- DELETE /tickets/:id - Close ticket

**Messages:**
- GET /tickets/:id/messages - List messages
- POST /tickets/:id/messages - Add message

**Users:**
- GET /users - List team members
- GET /users/:id - Get user details

Rate limit: 100 requests per minute.

View full documentation at developers.helpdeskpro.com`,
    category: "Developers",
    tags: ["api", "developers", "integration", "rest", "automation"],
  },
  {
    title: "Understanding SLA and Response Times",
    content: `SLA (Service Level Agreement) defines our commitment to response times.

**Our SLA commitments:**

- **Standard Plan:** 24-hour response time
- **Professional Plan:** 4-hour response time  
- **Enterprise Plan:** 1-hour response time

**SLA timers start when:**
- A new ticket is created
- A customer replies to an existing ticket

**SLA timers pause when:**
- The ticket is marked "Waiting for Customer"
- The customer requests a feature (not a bug)

**SLA timers reset when:**
- The ticket status changes to "Closed"

**Viewing SLA status:**
- SLA status is visible on each ticket
- Managers can view SLA reports in Analytics
- Automated warnings are sent 4 hours before breach`,
    category: "Support",
    tags: ["sla", "response time", "support", "commitment", "timelines"],
  },
  {
    title: "How to Submit a Feature Request",
    content: `We love hearing your ideas! Here's how to submit feature requests:

**1. Check existing requests**
- Search our public roadmap
- Upvote existing requests
- Add comments to clarify your use case

**2. Submit a new request**
- Go to Help > Feature Requests
- Click "New Request"
- Fill in:
  - Clear title
  - Detailed description
  - Use case and benefits
  - Mockups or examples (optional)

**3. What makes a great request?**
- Explain the problem you're solving
- Describe your ideal solution
- Mention how it helps others
- Keep it focused on one feature

**Evaluation criteria:**
- How many customers benefit?
- Does it align with our vision?
- Is it technically feasible?
- What's the development effort?

We'll notify you when your request is reviewed!`,
    category: "Feedback",
    tags: ["feature request", "feedback", "roadmap", "suggestions", "product"],
  },
];

async function seedKnowledgeBase() {
  console.log('🌱 Seeding knowledge base articles...');
  
  for (const article of knowledgeBaseArticles) {
    try {
      await addDoc(collection(db, 'knowledgeBase'), {
        ...article,
        viewCount: Math.floor(Math.random() * 100),
        helpfulCount: Math.floor(Math.random() * 50),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`✅ Added: ${article.title}`);
    } catch (error) {
      console.error(`❌ Failed to add ${article.title}:`, error);
    }
  }
  
  console.log('🎉 Knowledge base seeding complete!');
}

// Run the seed function
seedKnowledgeBase().catch(console.error);
