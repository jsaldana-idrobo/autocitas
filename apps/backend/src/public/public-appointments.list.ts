import { DateTime } from "luxon";
import type { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema.js";
import { Business } from "../schemas/business.schema.js";
import { assertActiveBusiness, DEFAULT_TIMEZONE } from "./public.service.helpers.js";

export async function listAppointmentsByPhone(
  businessModel: Model<Business>,
  appointmentModel: Model<Appointment>,
  slug: string,
  phone?: string
) {
  if (!phone || phone.trim().length < 7) {
    return { appointments: [] };
  }

  const business = await businessModel.findOne({ slug }).lean();
  assertActiveBusiness(business);
  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const todayStartUtc = DateTime.now().setZone(timezone).startOf("day").toUTC().toJSDate();

  const appointments = await appointmentModel
    .find({
      businessId: business._id,
      customerPhone: phone.trim(),
      status: { $ne: "cancelled" },
      startTime: { $gte: todayStartUtc }
    })
    .sort({ startTime: 1 })
    .lean();

  return { appointments };
}
