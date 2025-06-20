import dotenv from "dotenv";
import { EmailConfig, HotelConfig } from "../types/Interfaces";

dotenv.config();

export const emailConfig: EmailConfig = {
  imap: {
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993"),
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
  },
};

export const hotelConfig: HotelConfig = {
  name: process.env.HOTEL_NAME || "Grand Hotel",
  email: process.env.HOTEL_EMAIL || "reservations@grandhotel.com",
  phone: process.env.HOTEL_PHONE || "+1-555-0123",
  address: process.env.HOTEL_ADDRESS || "123 Hotel Street, City, State 12345",
};

export const appConfig = {
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || "5"),
  logLevel: process.env.LOG_LEVEL || "info",
};
