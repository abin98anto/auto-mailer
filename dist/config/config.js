"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = exports.hotelConfig = exports.emailConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.emailConfig = {
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
exports.hotelConfig = {
    name: process.env.HOTEL_NAME || "Grand Hotel",
    email: process.env.HOTEL_EMAIL || "reservations@grandhotel.com",
    phone: process.env.HOTEL_PHONE || "+1-555-0123",
    address: process.env.HOTEL_ADDRESS || "123 Hotel Street, City, State 12345",
};
exports.appConfig = {
    checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || "5"),
    logLevel: process.env.LOG_LEVEL || "info",
};
//# sourceMappingURL=config.js.map