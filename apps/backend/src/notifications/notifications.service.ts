import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DateTime } from "luxon";
import type { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Business } from "../schemas/business.schema.js";
import twilio from "twilio";

const REMINDER_WINDOWS_HOURS = [3];
const WINDOW_MINUTES = 2;

type AppointmentDoc = Appointment & { reminderSentHours?: number[] };

export class NotificationsService {
  private readonly twilioClient?: ReturnType<typeof twilio>;
  private readonly fromNumber?: string;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<AppointmentDoc>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (sid && token && from) {
      this.twilioClient = twilio(sid, token);
      this.fromNumber = from;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    if (!this.isConfigured()) {
      return;
    }

    const nowUtc = DateTime.utc();
    for (const hours of REMINDER_WINDOWS_HOURS) {
      const windowStart = nowUtc.plus({ hours }).minus({ minutes: WINDOW_MINUTES });
      const windowEnd = nowUtc.plus({ hours }).plus({ minutes: WINDOW_MINUTES });

      const appointments = await this.appointmentModel
        .find({
          status: "booked",
          startTime: { $gte: windowStart.toJSDate(), $lte: windowEnd.toJSDate() },
          reminderSentHours: { $ne: hours }
        })
        .lean();

      for (const appointment of appointments) {
        const business = await this.businessModel.findById(appointment.businessId).lean();
        if (!business) continue;
        const timezone = business.timezone || "America/Bogota";
        const message = this.buildReminderMessage(
          appointment.customerName,
          appointment.startTime,
          timezone
        );

        const sent = await this.sendSms(appointment.customerPhone, message, "reminder");
        if (sent) {
          await this.appointmentModel.updateOne(
            { _id: appointment._id },
            { $addToSet: { reminderSentHours: hours } }
          );
        }
      }
    }
  }

  async sendCreationConfirmationForAppointment(appointmentId: string) {
    if (!this.isConfigured()) {
      return;
    }

    const appointment = await this.appointmentModel.findById(appointmentId).lean();
    if (!appointment || appointment.status !== "booked") {
      return;
    }

    const business = await this.businessModel.findById(appointment.businessId).lean();
    if (!business) {
      return;
    }

    const timezone = business.timezone || "America/Bogota";
    const message = this.buildCreationMessage(
      appointment.customerName,
      appointment.startTime,
      timezone
    );

    await this.sendSms(appointment.customerPhone, message, "creation");
  }

  private isConfigured() {
    return Boolean(this.twilioClient && this.fromNumber);
  }

  private buildCreationMessage(customerName: string, startTime: Date, timezone: string) {
    const startLocal = DateTime.fromJSDate(startTime).setZone(timezone);
    return `Hola ${customerName}, tu cita fue creada para el ${startLocal.toFormat(
      "dd/LL/yyyy"
    )} a las ${startLocal.toFormat("HH:mm")}.`;
  }

  private buildReminderMessage(customerName: string, startTime: Date, timezone: string) {
    const startLocal = DateTime.fromJSDate(startTime).setZone(timezone);
    return `Hola ${customerName}, tienes una cita el ${startLocal.toFormat("dd/LL/yyyy")} a las ${startLocal.toFormat("HH:mm")}.`;
  }

  private async sendSms(to: string, body: string, type: "creation" | "reminder") {
    if (!this.twilioClient || !this.fromNumber) {
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        to,
        from: this.fromNumber,
        body
      });
      return true;
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SMS ${type} failed for ${to}: ${details}`);
      return false;
    }
  }
}
