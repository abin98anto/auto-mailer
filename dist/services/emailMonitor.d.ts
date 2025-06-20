import { ParsedEmail } from "../types/Interfaces";
export declare class EmailMonitor {
    private imap;
    private processedEmails;
    constructor();
    private setupEventHandlers;
    private openInbox;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    checkForNewEmails(): Promise<ParsedEmail[]>;
    private extractEmailAddress;
}
//# sourceMappingURL=emailMonitor.d.ts.map