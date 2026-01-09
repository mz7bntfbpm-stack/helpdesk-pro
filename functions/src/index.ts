import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import { WebClient } from '@slack/web-api';

admin.initializeApp();

// Configuration
const SENDGRID_API_KEY = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
const SLACK_TOKEN = functions.config().slack?.token || process.env.SLACK_TOKEN;
const SLACK_CHANNEL = functions.config().slack?.channel || '#support-tickets';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const slackClient = SLACK_TOKEN ? new WebClient(SLACK_TOKEN) : null;

// Firestore references
const db = admin.firestore();
const ticketsRef = db.collection('tickets');
const usersRef = db.collection('users');
const metricsRef = db.collection('metrics');

/**
 * Auto-assign new tickets to available agents using round-robin
 * with load balancing based on current active ticket count
 */
export const autoAssignTicket = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const ticketData = snapshot.data();
    const ticketId = context.params.ticketId;

    // Skip if already assigned
    if (ticketData.agentId) {
      return null;
    }

    try {
      // Get all active agents
      const agentsSnapshot = await usersRef
        .where('role', 'in', ['agent', 'manager'])
        .where('isActive', '==', true)
        .get();

      if (agentsSnapshot.empty) {
        console.log('No active agents found');
        return null;
      }

      // Get current active ticket count for each agent
      const agentStats = await Promise.all(
        agentsSnapshot.docs.map(async (agentDoc) => {
          const agentData = agentDoc.data();
          const activeTicketsSnapshot = await ticketsRef
            .where('agentId', '==', agentDoc.id)
            .where('status', 'in', ['new', 'in_progress', 'waiting'])
            .get();

          return {
            id: agentDoc.id,
            name: agentData.displayName,
            email: agentData.email,
            skills: agentData.skills || [],
            activeTickets: activeTicketsSnapshot.size,
          };
        })
      );

      // Sort by active ticket count (ascending) for load balancing
      agentStats.sort((a, b) => a.activeTickets - b.activeTickets);

      // Select agent with least tickets
      const selectedAgent = agentStats[0];

      // Update ticket with assignment
      await ticketsRef.doc(ticketId).update({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        status: 'in_progress',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Ticket ${ticketId} auto-assigned to ${selectedAgent.name}`);

      // Send Slack notification
      if (slackClient) {
        try {
          await slackClient.chat.postMessage({
            channel: SLACK_CHANNEL,
            text: `🎫 New ticket assigned`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*🎫 New Ticket Assigned*\n*Ticket:* ${ticketData.ticketNumber}\n*Subject:* ${ticketData.subject}\n*Assigned to:* ${selectedAgent.name}\n*Priority:* ${ticketData.priority}`,
                },
              },
            ],
          });
        } catch (slackError) {
          console.error('Failed to send Slack notification:', slackError);
        }
      }

      return null;
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      return null;
    }
  });

/**
 * Send auto-reply email when ticket is created
 */
export const sendTicketConfirmation = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const ticketData = snapshot.data();
    const ticketId = context.params.ticketId;

    if (!SENDGRID_API_KEY) {
      console.log('SendGrid API key not configured');
      return null;
    }

    try {
      const msg = {
        to: ticketData.customerEmail,
        from: functions.config().sendgrid?.from_email || 'support@helpdeskpro.com',
        subject: `Ticket Created: ${ticketData.ticketNumber} - ${ticketData.subject}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4f46e5, #f97316); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">HelpDesk Pro</h1>
            </div>
            <div style="padding: 24px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 16px;">Ticket Created Successfully</h2>
              <p style="color: #6b7280; margin-bottom: 24px;">
                Thank you for contacting us. Your support ticket has been created.
              </p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket Number:</strong> ${ticketData.ticketNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${ticketData.subject}</p>
                <p style="margin: 0 0 8px 0;"><strong>Priority:</strong> ${ticketData.priority}</p>
                <p style="margin: 0;"><strong>Status:</strong> Open</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Our support team will respond within 24 hours during business hours.
                You can track the status of your ticket at any time.
              </p>
            </div>
            <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} HelpDesk Pro. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      console.log(`Confirmation email sent to ${ticketData.customerEmail}`);
      return null;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return null;
    }
  });

/**
 * Send Slack notification for new high-priority tickets
 */
export const notifyHighPriorityTicket = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const ticketData = snapshot.data();

    // Only notify for urgent/high priority tickets
    if (ticketData.priority !== 'urgent' && ticketData.priority !== 'high') {
      return null;
    }

    if (!slackClient) {
      console.log('Slack client not configured');
      return null;
    }

    try {
      await slackClient.chat.postMessage({
        channel: SLACK_CHANNEL,
        text: `🚨 High Priority Ticket: ${ticketData.ticketNumber}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 ${ticketData.priority === 'urgent' ? 'URGENT' : 'HIGH'} Priority Ticket*`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Ticket:*\n${ticketData.ticketNumber}`,
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${ticketData.subject}`,
              },
              {
                type: 'mrkdwn',
                text: `*Customer:*\n${ticketData.customerName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Priority:*\n${ticketData.priority.toUpperCase()}`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Created at ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      });

      console.log(`Slack notification sent for ${ticketData.ticketNumber}`);
      return null;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return null;
    }
  });

/**
 * Mark first agent response for SLA tracking
 */
export const trackFirstResponse = functions.firestore
  .document('tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if this is the first agent response
    const hasAgentReplied = beforeData.firstResponseAt === undefined && 
      afterData.firstResponseAt !== undefined;
    
    // Check if status changed to in_progress from new
    const justStarted = beforeData.status === 'new' && afterData.status === 'in_progress';

    if (hasAgentReplied || justStarted) {
      const firstResponseAt = afterData.firstResponseAt || admin.firestore.FieldValue.serverTimestamp();
      
      await ticketsRef.doc(context.params.ticketId).update({
        firstResponseAt,
      });

      console.log(`First response tracked for ticket ${context.params.ticketId}`);
    }

    return null;
  });

/**
 * Daily scheduled task to close inactive tickets (7+ days without update)
 */
export const autoCloseInactiveTickets = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const inactiveTicketsSnapshot = await ticketsRef
        .where('status', '!=', 'closed')
        .where('updatedAt', '<', sevenDaysAgo)
        .get();

      if (inactiveTicketsSnapshot.empty) {
        console.log('No inactive tickets to close');
        return null;
      }

      const batch = db.batch();
      let closedCount = 0;

      inactiveTicketsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'closed',
          resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          autoClosed: true,
        });
        closedCount++;
      });

      await batch.commit();
      console.log(`Auto-closed ${closedCount} inactive tickets`);

      // Send summary to Slack
      if (slackClient && closedCount > 0) {
        try {
          await slackClient.chat.postMessage({
            channel: SLACK_CHANNEL,
            text: `📊 Daily Ticket Cleanup`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*📊 Daily Ticket Cleanup*\nAuto-closed ${closedCount} inactive tickets (7+ days without activity)`,
                },
              },
            ],
          });
        } catch (slackError) {
          console.error('Failed to send cleanup notification:', slackError);
        }
      }

      return null;
    } catch (error) {
      console.error('Auto-close failed:', error);
      return null;
    }
  });

/**
 * Send SLA warning notifications for tickets approaching deadline
 */
export const slaWarningNotifications = functions.pubsub
  .schedule('0 */4 * * *') // Run every 4 hours
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const warningThreshold = new Date();
    warningThreshold.setHours(warningThreshold.getHours() + 4); // 4 hours warning

    const now = new Date();

    try {
      // Find tickets at risk of SLA breach
      const atRiskSnapshot = await ticketsRef
        .where('status', 'in', ['new', 'in_progress'])
        .where('slaDeadline', '>', now)
        .where('slaDeadline', '<', warningThreshold)
        .get();

      if (atRiskSnapshot.empty) {
        console.log('No tickets at risk of SLA breach');
        return null;
      }

      const atRiskTickets = atRiskSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Send Slack notification
      if (slackClient) {
        const ticketList = atRiskTickets
          .map((t) => `• ${t.ticketNumber} - ${t.subject} (${t.agentName || 'Unassigned'})`)
          .join('\n');

        try {
          await slackClient.chat.postMessage({
            channel: SLACK_CHANNEL,
            text: `⚠️ SLA Warning: ${atRiskTickets.length} tickets at risk`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*⚠️ SLA Warning*\n${atRiskTickets.length} tickets at risk of breaching SLA within 4 hours:\n\n${ticketList}`,
                },
              },
            ],
          });
        } catch (slackError) {
          console.error('Failed to send SLA warning:', slackError);
        }
      }

      // Send email notifications to assigned agents
      for (const ticket of atRiskTickets) {
        if (ticket.agentEmail && SENDGRID_API_KEY) {
          try {
            const msg = {
              to: ticket.agentEmail,
              from: functions.config().sendgrid?.from_email || 'support@helpdeskpro.com',
              subject: `⚠️ SLA Warning: ${ticket.ticketNumber}`,
              html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #f97316; padding: 16px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SLA Warning</h1>
                  </div>
                  <div style="padding: 24px; background: #f9fafb;">
                    <p style="color: #6b7280;">The following ticket is at risk of breaching SLA:</p>
                    <div style="background: white; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0;"><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                      <p style="margin: 0;"><strong>SLA Deadline:</strong> ${ticket.slaDeadline?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                      Please take action to prevent SLA breach.
                    </p>
                    <a href="${functions.config()?.app?.url || 'https://helpdeskpro.com'}/agent/ticket/${ticket.id}" 
                       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
                      View Ticket
                    </a>
                  </div>
                </div>
              `,
            };
            await sgMail.send(msg);
          } catch (emailError) {
            console.error(`Failed to send SLA warning for ${ticket.id}:`, emailError);
          }
        }
      }

      console.log(`SLA warnings sent for ${atRiskTickets.length} tickets`);
      return null;
    } catch (error) {
      console.error('SLA warning check failed:', error);
      return null;
    }
  });

/**
 * Daily metrics aggregation for analytics dashboard
 */
export const aggregateDailyMetrics = functions.pubsub
  .schedule('0 23 * * *') // Run at 11 PM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get today's tickets
      const todayStart = admin.firestore.Timestamp.fromDate(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = admin.firestore.Timestamp.fromDate(tomorrow);

      // Aggregate by agent
      const agentMetrics: Record<string, { ticketsOpened: number; ticketsClosed: number; totalResponseTime: number; responseCount: number }> = {};

      const todayTicketsSnapshot = await ticketsRef
        .where('createdAt', '>=', todayStart)
        .where('createdAt', '<', tomorrowStart)
        .get();

      todayTicketsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const agentId = data.agentId || 'unassigned';
        
        if (!agentMetrics[agentId]) {
          agentMetrics[agentId] = { ticketsOpened: 0, ticketsClosed: 0, totalResponseTime: 0, responseCount: 0 };
        }
        agentMetrics[agentId].ticketsOpened++;
      });

      const closedTodaySnapshot = await ticketsRef
        .where('resolvedAt', '>=', todayStart)
        .where('resolvedAt', '<', tomorrowStart)
        .get();

      closedTodaySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const agentId = data.agentId || 'unassigned';
        
        if (!agentMetrics[agentId]) {
          agentMetrics[agentId] = { ticketsOpened: 0, ticketsClosed: 0, totalResponseTime: 0, responseCount: 0 };
        }
        agentMetrics[agentId].ticketsClosed++;
      });

      // Calculate SLA compliance
      const allOpenTickets = await ticketsRef
        .where('status', 'in', ['new', 'in_progress', 'waiting'])
        .get();

      let slaCompliant = 0;
      allOpenTickets.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.slaDeadline || data.slaDeadline > now) {
          slaCompliant++;
        }
      });

      const totalOpen = allOpenTickets.size;
      const slaCompliance = totalOpen > 0 ? (slaCompliant / totalOpen) * 100 : 100;

      // Save daily aggregate
      const metricsDoc = metricsRef.doc(format(today, 'yyyy-MM-dd'));
      
      await metricsDoc.set({
        date: format(today, 'yyyy-MM-dd'),
        ticketsOpened: todayTicketsSnapshot.size,
        ticketsClosed: closedTodaySnapshot.size,
        slaCompliance,
        agentMetrics,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`Daily metrics saved for ${format(today, 'yyyy-MM-dd')}`);
      return null;
    } catch (error) {
      console.error('Metrics aggregation failed:', error);
      return null;
    }
  });

/**
 * Send reminder to customers if no response after 24 hours
 */
export const customerReminderNotification = functions.pubsub
  .schedule('0 9 * * *') // Run at 9 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
      // Find tickets waiting for customer response
      const waitingSnapshot = await ticketsRef
        .where('status', '==', 'waiting')
        .where('updatedAt', '<', twentyFourHoursAgo)
        .get();

      if (waitingSnapshot.empty) {
        console.log('No tickets waiting for customer response');
        return null;
      }

      let sentCount = 0;

      for (const doc of waitingSnapshot.docs) {
        const ticket = doc.data();

        // Check if we've already sent a reminder recently
        if (ticket.lastReminderAt) {
          const daysSinceReminder = (new Date().getTime() - ticket.lastReminderAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceReminder < 2) {
            continue; // Skip if reminder sent within 2 days
          }
        }

        if (SENDGRID_API_KEY) {
          try {
            const msg = {
              to: ticket.customerEmail,
              from: functions.config().sendgrid?.from_email || 'support@helpdeskpro.com',
              subject: `Reminder: Your ticket ${ticket.ticketNumber} is waiting for your response`,
              html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #4f46e5, #f97316); padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0;">HelpDesk Pro</h1>
                  </div>
                  <div style="padding: 24px; background: #f9fafb;">
                    <h2 style="color: #1f2937; margin-bottom: 16px;">We'd love to hear from you!</h2>
                    <p style="color: #6b7280; margin-bottom: 24px;">
                      Your support ticket has been waiting for your response for over 24 hours.
                    </p>
                    <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0;"><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                      <p style="margin: 0;"><strong>Last Update:</strong> ${ticket.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                      Please reply to our support team so we can help resolve your issue.
                    </p>
                    <a href="${functions.config()?.app?.url || 'https://helpdeskpro.com'}/portal/ticket/${ticket.id}" 
                       style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
                      Reply to Ticket
                    </a>
                  </div>
                </div>
              `,
            };
            await sgMail.send(msg);

            // Mark that we've sent a reminder
            await doc.ref.update({
              lastReminderAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            sentCount++;
          } catch (emailError) {
            console.error(`Failed to send reminder for ${doc.id}:`, emailError);
          }
        }
      }

      console.log(`Customer reminders sent for ${sentCount} tickets`);
      return null;
    } catch (error) {
      console.error('Customer reminder check failed:', error);
      return null;
    }
  });

/**
 * Update agent metrics when ticket is closed
 */
export const updateAgentMetrics = functions.firestore
  .document('tickets/{ticketId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only track when ticket is closed
    if (beforeData.status !== 'closed' && afterData.status === 'closed') {
      const agentId = afterData.agentId;
      
      if (!agentId) {
        return null;
      }

      try {
        // Calculate response time in minutes
        let responseTime = 0;
        if (afterData.firstResponseAt) {
          responseTime = (afterData.firstResponseAt.toDate().getTime() - afterData.createdAt.toDate().getTime()) / 60000;
        }

        // Update agent's personal metrics subcollection
        const agentMetricsRef = usersRef.doc(agentId).collection('metrics').doc(context.params.ticketId);
        
        await agentMetricsRef.set({
          ticketId: context.params.ticketId,
          ticketNumber: afterData.ticketNumber,
          closedAt: admin.firestore.FieldValue.serverTimestamp(),
          responseTime,
          satisfactionRating: afterData.satisfactionRating || null,
          timeSpent: afterData.timeSpent || 0,
        });

        // Update aggregate stats
        const userDoc = await usersRef.doc(agentId).get();
        const userData = userDoc.data();
        
        if (userData) {
          const currentClosed = userData.ticketsClosed || 0;
          const currentAvgResponse = userData.avgResponseTime || 0;
          const currentCsat = userData.csatScore || 0;

          let newAvgResponse = currentAvgResponse;
          let newCsat = currentCsat;
          let totalRatings = (userData.totalRatings || 0) + (afterData.satisfactionRating ? 1 : 0);

          if (responseTime > 0) {
            newAvgResponse = ((currentAvgResponse * currentClosed) + responseTime) / (currentClosed + 1);
          }

          if (afterData.satisfactionRating) {
            newCsat = ((currentCsat * userData.totalRatings) + afterData.satisfactionRating) / totalRatings;
          }

          await usersRef.doc(agentId).update({
            ticketsClosed: currentClosed + 1,
            avgResponseTime: newAvgResponse,
            csatScore: newCsat,
            totalRatings,
            lastTicketClosedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        console.log(`Agent metrics updated for ticket ${context.params.ticketId}`);
        return null;
      } catch (error) {
        console.error('Failed to update agent metrics:', error);
        return null;
      }
    }

    return null;
  });

// Export for testing
export { sgMail, slackClient };
