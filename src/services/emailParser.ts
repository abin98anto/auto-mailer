import { ReservationDetails } from "../types/Interfaces";
import { logger } from "../utils/logger";

export class EmailParser {
  private static reservationKeywords = [
    "reservation",
    "booking",
    "confirmation",
    "check-in",
    "check-out",
    "hotel",
    "room",
    "guest",
    "stay",
    "arrival",
    "departure",
  ];

  static isReservationEmail(subject: string, content: string): boolean {
    const text = (subject + " " + content).toLowerCase();
    const keywordCount = this.reservationKeywords.filter((keyword) =>
      text.includes(keyword)
    ).length;

    // Consider it a reservation email if it contains at least 2 keywords
    return keywordCount >= 2;
  }

  static parseReservationDetails(content: string): ReservationDetails {
    const details: ReservationDetails = {};

    try {
      // Extract confirmation number
      const confirmationMatch = content.match(
        /confirmation\s*(?:number|#|code)?\s*:?\s*([A-Z0-9]{6,})/i
      );
      if (confirmationMatch) {
        details.confirmationNumber = confirmationMatch[1];
      }

      // Extract guest name
      const nameMatch = content.match(
        /(?:guest|name|customer)\s*:?\s*([A-Za-z\s]{2,30})/i
      );
      if (nameMatch) {
        details.guestName = nameMatch[1].trim();
      }

      // Extract email
      const emailMatch = content.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
      );
      if (emailMatch) {
        details.email = emailMatch[1];
      }

      // Extract check-in date
      const checkinMatch = content.match(
        /check[-\s]?in\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
      );
      if (checkinMatch) {
        details.checkInDate = checkinMatch[1];
      }

      // Extract check-out date
      const checkoutMatch = content.match(
        /check[-\s]?out\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
      );
      if (checkoutMatch) {
        details.checkOutDate = checkoutMatch[1];
      }

      // Extract room type
      const roomMatch = content.match(
        /room\s*(?:type)?\s*:?\s*([A-Za-z\s]{3,20})/i
      );
      if (roomMatch) {
        details.roomType = roomMatch[1].trim();
      }

      // Extract number of guests
      const guestsMatch = content.match(
        /(?:guests?|adults?|people)\s*:?\s*(\d+)/i
      );
      if (guestsMatch) {
        details.numberOfGuests = parseInt(guestsMatch[1]);
      }

      // Extract total amount
      const amountMatch = content.match(
        /(?:total|amount|price|cost)\s*:?\s*\$?([0-9,]+\.?\d*)/i
      );
      if (amountMatch) {
        details.totalAmount = `$${amountMatch[1]}`;
      }

      // Extract special requests
      const requestsMatch = content.match(
        /(?:special\s*requests?|notes?|comments?)\s*:?\s*([^.\n]{10,100})/i
      );
      if (requestsMatch) {
        details.specialRequests = requestsMatch[1].trim();
      }

      logger.info("Parsed reservation details", { details });
      return details;
    } catch (error) {
      logger.error("Error parsing reservation details", {
        error,
        content: content.substring(0, 200),
      });
      return details;
    }
  }

  static extractEmailFromContent(content: string): string | null {
    const emailMatch = content.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    return emailMatch ? emailMatch[1] : null;
  }
}
