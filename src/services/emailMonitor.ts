import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { logger } from "../utils/logger";
import { emailConfig } from "../config/config";
import { ParsedEmail } from "../types/Interfaces";

export class EmailMonitor {
  private imap: Imap;
  private processedEmails = new Set<string>();

  constructor() {
    this.imap = new Imap({
      user: emailConfig.imap.user,
      password: emailConfig.imap.password,
      host: emailConfig.imap.host,
      port: emailConfig.imap.port,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.imap.once("ready", () => {
      logger.info("IMAP connection ready");
      this.openInbox();
    });

    this.imap.once("error", (err: Error) => {
      logger.error("IMAP connection error", { error: err.message });
    });

    this.imap.once("end", () => {
      logger.info("IMAP connection ended");
    });
  }

  private openInbox(): void {
    this.imap.openBox("INBOX", false, (err: Error, box: Imap.Box) => {
      if (err) {
        logger.error("Error opening inbox", { error: err.message });
        return;
      }
      logger.info("Inbox opened successfully", {
        totalMessages: box.messages.total,
      });
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => resolve());
      this.imap.once("error", (err: Error) => reject(err));
      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.imap.once("end", () => resolve());
      this.imap.end();
    });
  }

  async checkForNewEmails(): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      if (this.imap.state !== "authenticated") {
        reject(new Error("IMAP not connected"));
        return;
      }

      // Search for unread emails from the last 24 hours
      const searchDate = new Date();
      searchDate.setDate(searchDate.getDate() - 1);

      this.imap.search(
        ["UNSEEN", ["SINCE", searchDate]],
        (err: Error, results: number[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          logger.info(`Found ${results.length} new emails`);

          const emails: ParsedEmail[] = [];
          let processed = 0;

          const fetch = this.imap.fetch(results, { bodies: "" });

          fetch.on("message", (msg: Imap.ImapMessage, seqno: number) => {
            let buffer = "";

            msg.on("body", (stream: NodeJS.ReadableStream) => {
              stream.on("data", (chunk: Buffer) => {
                buffer += chunk.toString("utf8");
              });

              stream.once("end", async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const messageId =
                    parsed.messageId || `${seqno}-${Date.now()}`;

                  if (this.processedEmails.has(messageId)) {
                    processed++;
                    if (processed === results.length) {
                      resolve(emails);
                    }
                    return;
                  }

                  this.processedEmails.add(messageId);

                  const email: ParsedEmail = {
                    from: this.extractEmailAddress(parsed.from),
                    to: this.extractEmailAddress(parsed.to),
                    subject: parsed.subject || "",
                    text: parsed.text || "",
                    html: parsed.html ? parsed.html.toString() : "",
                    date: parsed.date || new Date(),
                    messageId: messageId,
                  };

                  emails.push(email);
                  logger.info("Parsed new email", {
                    from: email.from,
                    subject: email.subject,
                    messageId: email.messageId,
                  });

                  processed++;
                  if (processed === results.length) {
                    resolve(emails);
                  }
                } catch (parseError) {
                  logger.error("Error parsing email", {
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

            msg.once("attributes", (attrs: Imap.ImapMessageAttributes) => {
              // Mark as read
              this.imap.addFlags(attrs.uid, ["\\Seen"], (err: Error) => {
                if (err) {
                  logger.error("Error marking email as read", {
                    error: err.message,
                    uid: attrs.uid,
                  });
                }
              });
            });
          });

          fetch.once("error", (fetchErr: Error) => {
            reject(fetchErr);
          });

          fetch.once("end", () => {
            if (results.length === 0) {
              resolve(emails);
            }
          });
        }
      );
    });
  }

  private extractEmailAddress(addressObj: any): string {
    if (!addressObj) return "";

    if (Array.isArray(addressObj)) {
      // If it's an array, take the first address
      return addressObj.length > 0
        ? addressObj[0].address || addressObj[0].name || ""
        : "";
    } else {
      // If it's a single AddressObject
      return addressObj.address || addressObj.name || "";
    }
  }
}
