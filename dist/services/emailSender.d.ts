import { ReservationDetails } from "../types/Interfaces";
export declare class EmailSender {
    private transporter;
    constructor();
    sendReservationResponse(recipientEmail: string, reservationDetails: ReservationDetails, originalSubject: string): Promise<boolean>;
    private generateReservationResponse;
    private generateTextResponse;
    private generateHtmlResponse;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=emailSender.d.ts.map