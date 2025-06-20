"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSender = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class EmailSender {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: config_1.emailConfig.smtp.host,
            port: config_1.emailConfig.smtp.port,
            secure: config_1.emailConfig.smtp.port === 465,
            auth: {
                user: config_1.emailConfig.smtp.user,
                pass: config_1.emailConfig.smtp.password,
            },
        });
    }
    async sendReservationResponse(recipientEmail, reservationDetails, originalSubject) {
        try {
            const response = this.generateReservationResponse(reservationDetails, originalSubject);
            const mailOptions = {
                from: `${config_1.hotelConfig.name} <${config_1.emailConfig.smtp.user}>`,
                to: recipientEmail,
                subject: response.subject,
                text: response.text,
                html: response.html,
            };
            const result = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info("Reservation response sent successfully", {
                to: recipientEmail,
                messageId: result.messageId,
                confirmationNumber: reservationDetails.confirmationNumber,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error("Failed to send reservation response", {
                error: error instanceof Error ? error.message : "Unknown error",
                recipientEmail,
                confirmationNumber: reservationDetails.confirmationNumber,
            });
            return false;
        }
    }
    generateReservationResponse(details, originalSubject) {
        const subject = `Re: ${originalSubject} - Reservation Confirmation`;
        const text = this.generateTextResponse(details);
        const html = this.generateHtmlResponse(details);
        return { to: details.email || "", subject, text, html };
    }
    generateTextResponse(details) {
        return `
Dear ${details.guestName || "Valued Guest"},

Thank you for your reservation inquiry. We have received your booking request and are pleased to confirm the following details:

${details.confirmationNumber
            ? `Confirmation Number: ${details.confirmationNumber}`
            : ""}
${details.guestName ? `Guest Name: ${details.guestName}` : ""}
${details.checkInDate ? `Check-in Date: ${details.checkInDate}` : ""}
${details.checkOutDate ? `Check-out Date: ${details.checkOutDate}` : ""}
${details.roomType ? `Room Type: ${details.roomType}` : ""}
${details.numberOfGuests ? `Number of Guests: ${details.numberOfGuests}` : ""}
${details.totalAmount ? `Total Amount: ${details.totalAmount}` : ""}
${details.specialRequests ? `Special Requests: ${details.specialRequests}` : ""}

We look forward to welcoming you to ${config_1.hotelConfig.name}. If you have any questions or need to make changes to your reservation, please don't hesitate to contact us.

Hotel Information:
${config_1.hotelConfig.name}
${config_1.hotelConfig.address}
Phone: ${config_1.hotelConfig.phone}
Email: ${config_1.hotelConfig.email}

Thank you for choosing ${config_1.hotelConfig.name}. We appreciate your business and look forward to providing you with an exceptional stay.

Best regards,
${config_1.hotelConfig.name} Reservations Team

---
This is an automated response. If you need immediate assistance, please call us at ${config_1.hotelConfig.phone}.
    `.trim();
    }
    generateHtmlResponse(details) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c3e50; }
        .detail-item { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #2c3e50; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; }
        .hotel-info { background-color: #ecf0f1; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .automated-notice { font-size: 0.9em; color: #7f8c8d; font-style: italic; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${config_1.hotelConfig.name}</h1>
        <h2>Reservation Confirmation</h2>
    </div>
    
    <div class="content">
        <p>Dear <strong>${details.guestName || "Valued Guest"}</strong>,</p>
        
        <p>Thank you for your reservation inquiry. We have received your booking request and are pleased to confirm the following details:</p>
        
        <div class="details">
            <h3>Reservation Details</h3>
            ${details.confirmationNumber
            ? `<div class="detail-item"><span class="detail-label">Confirmation Number:</span> ${details.confirmationNumber}</div>`
            : ""}
            ${details.guestName
            ? `<div class="detail-item"><span class="detail-label">Guest Name:</span> ${details.guestName}</div>`
            : ""}
            ${details.checkInDate
            ? `<div class="detail-item"><span class="detail-label">Check-in Date:</span> ${details.checkInDate}</div>`
            : ""}
            ${details.checkOutDate
            ? `<div class="detail-item"><span class="detail-label">Check-out Date:</span> ${details.checkOutDate}</div>`
            : ""}
            ${details.roomType
            ? `<div class="detail-item"><span class="detail-label">Room Type:</span> ${details.roomType}</div>`
            : ""}
            ${details.numberOfGuests
            ? `<div class="detail-item"><span class="detail-label">Number of Guests:</span> ${details.numberOfGuests}</div>`
            : ""}
            ${details.totalAmount
            ? `<div class="detail-item"><span class="detail-label">Total Amount:</span> ${details.totalAmount}</div>`
            : ""}
            ${details.specialRequests
            ? `<div class="detail-item"><span class="detail-label">Special Requests:</span> ${details.specialRequests}</div>`
            : ""}
        </div>
        
        <p>We look forward to welcoming you to ${config_1.hotelConfig.name}. If you have any questions or need to make changes to your reservation, please don't hesitate to contact us.</p>
        
        <div class="hotel-info">
            <h3>Hotel Information</h3>
            <p><strong>${config_1.hotelConfig.name}</strong><br>
            ${config_1.hotelConfig.address}<br>
            Phone: <a href="tel:${config_1.hotelConfig.phone}">${config_1.hotelConfig.phone}</a><br>
            Email: <a href="mailto:${config_1.hotelConfig.email}">${config_1.hotelConfig.email}</a></p>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing ${config_1.hotelConfig.name}. We appreciate your business and look forward to providing you with an exceptional stay.</p>
            <p><strong>Best regards,</strong><br>
            ${config_1.hotelConfig.name} Reservations Team</p>
        </div>
        
        <div class="automated-notice">
            <p>This is an automated response. If you need immediate assistance, please call us at ${config_1.hotelConfig.phone}.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            logger_1.logger.info("SMTP connection verified successfully");
            return true;
        }
        catch (error) {
            logger_1.logger.error("SMTP connection failed", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return false;
        }
    }
}
exports.EmailSender = EmailSender;
//# sourceMappingURL=emailSender.js.map