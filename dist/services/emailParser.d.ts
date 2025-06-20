import { ReservationDetails } from "../types/Interfaces";
export declare class EmailParser {
    private static reservationKeywords;
    static isReservationEmail(subject: string, content: string): boolean;
    static parseReservationDetails(content: string): ReservationDetails;
    static extractEmailFromContent(content: string): string | null;
}
//# sourceMappingURL=emailParser.d.ts.map