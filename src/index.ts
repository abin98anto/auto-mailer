import * as cron from "node-cron";
import { EmailMonitor } from "./services/emailMonitor";
import { EmailSender } from "./services/emailSender";
import { EmailParser } from "./services/emailParser";
import { logger } from "./utils/logger";
import { appConfig } from "./config/config";
import { ParsedEmail } from "./types/Interfaces";

class HotelEmailAutomation {
  private emailMonitor: EmailMonitor;
  private emailSender: EmailSender;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.emailMonitor = new EmailMonitor();
    this.emailSender = new EmailSender();
  }

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing Hotel Email Automation System...");

      // Test SMTP connection
      const smtpReady = await this.emailSender.testConnection();
      if (!smtpReady) {
        throw new Error("SMTP connection failed");
      }

      // Connect to IMAP
      await this.emailMonitor.connect();
      logger.info("Email monitoring system initialized successfully");

      // Start monitoring
      this.startMonitoring();

      // Handle graceful shutdown
      process.on("SIGINT", () => this.shutdown());
      process.on("SIGTERM", () => this.shutdown());
    } catch (error) {
      logger.error("Failed to initialize email automation system", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  private startMonitoring(): void {
    const cronExpression = `*/${appConfig.checkIntervalMinutes} * * * *`;

    logger.info(
      `Starting email monitoring with ${appConfig.checkIntervalMinutes} minute intervals`
    );

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.processNewEmails();
    });

    // Run initial check
    this.processNewEmails();
  }

  private async processNewEmails(): Promise<void> {
    try {
      logger.info("Checking for new emails...");

      const newEmails = await this.emailMonitor.checkForNewEmails();

      if (newEmails.length === 0) {
        logger.info("No new emails found");
        return;
      }

      logger.info(`Processing ${newEmails.length} new emails`);

      for (const email of newEmails) {
        await this.processEmail(email);
      }
    } catch (error) {
      logger.error("Error processing new emails", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async processEmail(email: ParsedEmail): Promise<void> {
    try {
      logger.info("Processing email", {
        from: email.from,
        subject: email.subject,
        messageId: email.messageId,
      });

      // Check if this is a reservation-related email
      const isReservationEmail = EmailParser.isReservationEmail(
        email.subject,
        email.text
      );

      if (!isReservationEmail) {
        logger.info("Email is not reservation-related, skipping", {
          messageId: email.messageId,
          subject: email.subject,
        });
        return;
      }

      logger.info("Reservation email detected", { messageId: email.messageId });

      // Parse reservation details
      const reservationDetails = EmailParser.parseReservationDetails(
        email.text
      );

      // Extract sender email if not found in reservation details
      if (!reservationDetails.email) {
        const senderEmail = EmailParser.extractEmailFromContent(email.from);
        if (senderEmail) {
          reservationDetails.email = senderEmail;
        }
      }

      // Ensure we have an email to respond to
      if (!reservationDetails.email) {
        logger.warn("No email address found for reservation response", {
          messageId: email.messageId,
          from: email.from,
        });
        return;
      }

      // Send automated response
      const success = await this.emailSender.sendReservationResponse(
        reservationDetails.email,
        reservationDetails,
        email.subject
      );

      if (success) {
        logger.info("Automated reservation response sent successfully", {
          to: reservationDetails.email,
          confirmationNumber: reservationDetails.confirmationNumber,
          messageId: email.messageId,
        });
      } else {
        logger.error("Failed to send automated reservation response", {
          to: reservationDetails.email,
          messageId: email.messageId,
        });
      }
    } catch (error) {
      logger.error("Error processing individual email", {
        error: error instanceof Error ? error.message : "Unknown error",
        messageId: email.messageId,
        from: email.from,
      });
    }
  }

  private async shutdown(): Promise<void> {
    logger.info("Shutting down Hotel Email Automation System...");

    if (this.cronJob) {
      this.cronJob.stop();
      logger.info("Stopped email monitoring cron job");
    }

    try {
      await this.emailMonitor.disconnect();
      logger.info("Disconnected from email server");
    } catch (error) {
      logger.error("Error disconnecting from email server", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    logger.info("Hotel Email Automation System shut down complete");
    process.exit(0);
  }
}

// Start the application
const app = new HotelEmailAutomation();
app.initialize().catch((error) => {
  logger.error("Failed to start Hotel Email Automation System", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
