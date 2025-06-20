"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMonitor = void 0;
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class EmailMonitor {
    constructor() {
        this.processedEmails = new Set();
        this.imap = new imap_1.default({
            user: config_1.emailConfig.imap.user,
            password: config_1.emailConfig.imap.password,
            host: config_1.emailConfig.imap.host,
            port: config_1.emailConfig.imap.port,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.imap.once("ready", () => {
            logger_1.logger.info("IMAP connection ready");
            this.openInbox();
        });
        this.imap.once("error", (err) => {
            logger_1.logger.error("IMAP connection error", { error: err.message });
        });
        this.imap.once("end", () => {
            logger_1.logger.info("IMAP connection ended");
        });
    }
    openInbox() {
        this.imap.openBox("INBOX", false, (err, box) => {
            if (err) {
                logger_1.logger.error("Error opening inbox", { error: err.message });
                return;
            }
            logger_1.logger.info("Inbox opened successfully", {
                totalMessages: box.messages.total,
            });
        });
    }
    async connect() {
        return new Promise((resolve, reject) => {
            this.imap.once("ready", () => resolve());
            this.imap.once("error", (err) => reject(err));
            this.imap.connect();
        });
    }
    async disconnect() {
        return new Promise((resolve) => {
            this.imap.once("end", () => resolve());
            this.imap.end();
        });
    }
    async checkForNewEmails() {
        return new Promise((resolve, reject) => {
            if (this.imap.state !== "authenticated") {
                reject(new Error("IMAP not connected"));
                return;
            }
            // Search for unread emails from the last 24 hours
            const searchDate = new Date();
            searchDate.setDate(searchDate.getDate() - 1);
            this.imap.search(["UNSEEN", ["SINCE", searchDate]], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!results || results.length === 0) {
                    resolve([]);
                    return;
                }
                logger_1.logger.info(`Found ${results.length} new emails`);
                const emails = [];
                let processed = 0;
                const fetch = this.imap.fetch(results, { bodies: "" });
                fetch.on("message", (msg, seqno) => {
                    let buffer = "";
                    msg.on("body", (stream) => {
                        stream.on("data", (chunk) => {
                            buffer += chunk.toString("utf8");
                        });
                        stream.once("end", async () => {
                            try {
                                const parsed = await (0, mailparser_1.simpleParser)(buffer);
                                const messageId = parsed.messageId || `${seqno}-${Date.now()}`;
                                if (this.processedEmails.has(messageId)) {
                                    processed++;
                                    if (processed === results.length) {
                                        resolve(emails);
                                    }
                                    return;
                                }
                                this.processedEmails.add(messageId);
                                const email = {
                                    from: this.extractEmailAddress(parsed.from),
                                    to: this.extractEmailAddress(parsed.to),
                                    subject: parsed.subject || "",
                                    text: parsed.text || "",
                                    html: parsed.html ? parsed.html.toString() : "",
                                    date: parsed.date || new Date(),
                                    messageId: messageId,
                                };
                                emails.push(email);
                                logger_1.logger.info("Parsed new email", {
                                    from: email.from,
                                    subject: email.subject,
                                    messageId: email.messageId,
                                });
                                processed++;
                                if (processed === results.length) {
                                    resolve(emails);
                                }
                            }
                            catch (parseError) {
                                logger_1.logger.error("Error parsing email", {
                                    error: parseError,
                                    seqno,
                                });
                                processed++;
                                if (processed === results.length) {
                                    resolve(emails);
                                }
                            }
                        });
                    });
                    msg.once("attributes", (attrs) => {
                        // Mark as read
                        this.imap.addFlags(attrs.uid, ["\\Seen"], (err) => {
                            if (err) {
                                logger_1.logger.error("Error marking email as read", {
                                    error: err.message,
                                    uid: attrs.uid,
                                });
                            }
                        });
                    });
                });
                fetch.once("error", (fetchErr) => {
                    reject(fetchErr);
                });
                fetch.once("end", () => {
                    if (results.length === 0) {
                        resolve(emails);
                    }
                });
            });
        });
    }
    extractEmailAddress(addressObj) {
        if (!addressObj)
            return "";
        if (Array.isArray(addressObj)) {
            // If it's an array, take the first address
            return addressObj.length > 0
                ? addressObj[0].address || addressObj[0].name || ""
                : "";
        }
        else {
            // If it's a single AddressObject
            return addressObj.address || addressObj.name || "";
        }
    }
}
exports.EmailMonitor = EmailMonitor;
//# sourceMappingURL=emailMonitor.js.map