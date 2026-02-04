import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DateTime } from "luxon";
import { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Business } from "../schemas/business.schema";
import Twilio = require("twilio");

const REMINDER_WINDOWS_HOURS = [3];
const WINDOW_MINUTES = 2;

type AppointmentDoc = Appointment & { reminderSentHours?: number[] };

export class NotificationsService {
  private readonly twilioClient?: ReturnType<typeof Twilio>;
  private readonly fromNumber?: string;

  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<AppointmentDoc>,
    @InjectModel(Business.name) private readonly businessModel: Model<Business>
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (sid && token && from) {
      this.twilioClient = Twilio(sid, token);
      this.fromNumber = from;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    if (!this.twilioClient || !this.fromNumber) {
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
        const startLocal = DateTime.fromJSDate(appointment.startTime).setZone(timezone);
        const message = `Hola ${appointment.customerName}, tienes una cita el ${startLocal.toFormat(
          "dd/LL/yyyy"
        )} a las ${startLocal.toFormat("HH:mm")}.`;

        try {
          await this.twilioClient.messages.create({
            to: appointment.customerPhone,
            from: this.fromNumber,
            body: message
          });

          await this.appointmentModel.updateOne(
            { _id: appointment._id },
            { $addToSet: { reminderSentHours: hours } }
          );
        } catch {
          // Ignore to avoid retry storms; next run will retry if needed.
        }
      }
    }
  }
}
