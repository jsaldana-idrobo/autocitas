import { Model } from "mongoose";
import { Appointment } from "../schemas/appointment.schema";
import { Business } from "../schemas/business.schema";
import { assertActiveBusiness } from "./public.service.helpers";

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

  const appointments = await appointmentModel
    .find({ businessId: business._id, customerPhone: phone.trim() })
    .sort({ startTime: -1 })
    .lean();

  return { appointments };
}
