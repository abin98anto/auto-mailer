export interface ReservationDetails {
  confirmationNumber?: string;
  guestName?: string;
  email?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  numberOfGuests?: number;
  totalAmount?: string;
  bookingDate?: string;
  specialRequests?: string;
}

export interface EmailConfig {
  imap: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
}

export interface HotelConfig {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  messageId: string;
}

export interface EmailResponse {
  to: string;
  subject: string;
  html: string;
  text: string;
}
