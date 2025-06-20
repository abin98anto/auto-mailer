"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cron = __importStar(require("node-cron"));
const emailMonitor_1 = require("./services/emailMonitor");
const emailSender_1 = require("./services/emailSender");
const emailParser_1 = require("./services/emailParser");
const logger_1 = require("./utils/logger");
const config_1 = require("./config/config");
class HotelEmailAutomation {
    constructor() {
        this.cronJob = null;
        this.emailMonitor = new emailMonitor_1.EmailMonitor();
        this.emailSender = new emailSender_1.EmailSender();
    }
    async initialize() {
        try {
            logger_1.logger.info("Initializing Hotel Email Automation System...");
            // Test SMTP connection
            const smtpReady = await this.emailSender.testConnection();
            if (!smtpReady) {
                throw new Error("SMTP connection failed");
            }
            // Connect to IMAP
            await this.emailMonitor.connect();
            logger_1.logger.info("Email monitoring system initialized successfully");
            // Start monitoring
            this.startMonitoring();
            // Handle graceful shutdown
            process.on("SIGINT", () => this.shutdown());
            process.on("SIGTERM", () => this.shutdown());
        }
        catch (error) {
            logger_1.logger.error("Failed to initialize email automation system", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            process.exit(1);
        }
    }
    startMonitoring() {
        const cronExpression = `*/${config_1.appConfig.checkIntervalMinutes} * * * *`;
        logger_1.logger.info(`Starting email monitoring with ${config_1.appConfig.checkIntervalMinutes} minute intervals`);
        this.cronJob = cron.schedule(cronExpression, async () => {
            await this.processNewEmails();
        });
        // Run initial check
        this.processNewEmails();
    }
    async processNewEmails() {
        try {
            logger_1.logger.info("Checking for new emails...");
            const newEmails = await this.emailMonitor.checkForNewEmails();
            if (newEmails.length === 0) {
                logger_1.logger.info("No new emails found");
                return;
            }
            logger_1.logger.info(`Processing ${newEmails.length} new emails`);
            for (const email of newEmails) {
                await this.processEmail(email);
            }
        }
        catch (error) {
            logger_1.logger.error("Error processing new emails", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async processEmail(email) {
        try {
            logger_1.logger.info("Processing email", {
                from: email.from,
                subject: email.subject,
                messageId: email.messageId,
            });
            // Check if this is a reservation-related email
            const isReservationEmail = emailParser_1.EmailParser.isReservationEmail(email.subject, email.text);
            if (!isReservationEmail) {
                logger_1.logger.info("Email is not reservation-related, skipping", {
                    messageId: email.messageId,
                    subject: email.subject,
                });
                return;
            }
            logger_1.logger.info("Reservation email detected", { messageId: email.messageId });
            // Parse reservation details
            const reservationDetails = emailParser_1.EmailParser.parseReservationDetails(email.text);
            // Extract sender email if not found in reservation details
            if (!reservationDetails.email) {
                const senderEmail = emailParser_1.EmailParser.extractEmailFromContent(email.from);
                if (senderEmail) {
                    reservationDetails.email = senderEmail;
                }
            }
            // Ensure we have an email to respond to
            if (!reservationDetails.email) {
                logger_1.logger.warn("No email address found for reservation response", {
                    messageId: email.messageId,
                    from: email.from,
                });
                return;
            }
            // Send automated response
            const success = await this.emailSender.sendReservationResponse(reservationDetails.email, reservationDetails, email.subject);
            if (success) {
                logger_1.logger.info("Automated reservation response sent successfully", {
                    to: reservationDetails.email,
                    confirmationNumber: reservationDetails.confirmationNumber,
                    messageId: email.messageId,
                });
            }
            else {
                logger_1.logger.error("Failed to send automated reservation response", {
                    to: reservationDetails.email,
                    messageId: email.messageId,
                });
            }
        }
        catch (error) {
            logger_1.logger.error("Error processing individual email", {
                error: error instanceof Error ? error.message : "Unknown error",
                messageId: email.messageId,
                from: email.from,
            });
        }
    }
    async shutdown() {
        logger_1.logger.info("Shutting down Hotel Email Automation System...");
        if (this.cronJob) {
            this.cronJob.stop();
            logger_1.logger.info("Stopped email monitoring cron job");
        }
        try {
            await this.emailMonitor.disconnect();
            logger_1.logger.info("Disconnected from email server");
        }
        catch (error) {
            logger_1.logger.error("Error disconnecting from email server", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
        logger_1.logger.info("Hotel Email Automation System shut down complete");
        process.exit(0);
    }
}
// Start the application
const app = new HotelEmailAutomation();
app.initialize().catch((error) => {
    logger_1.logger.error("Failed to start Hotel Email Automation System", {
        error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
});
//# sourceMappingURL=index.js.map