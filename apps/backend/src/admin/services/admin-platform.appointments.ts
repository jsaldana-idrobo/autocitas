import { BadRequestException } from "@nestjs/common";
import { Model } from "mongoose";
import { Appointment } from "../../schemas/appointment.schema";
import { ERR_INVALID_DATE_FORMAT } from "./admin.constants";
import {
  applyTextSearchSort,
  buildAppointmentSearchQuery,
  TEXT_SCORE
} from "./admin-platform.query";

export async function listPlatformAppointmentsWithSearch(
  appointmentModel: Model<Appointment>,
  date?: string,
  status?: "booked" | "cancelled" | "completed",
  search?: string,
  page?: number,
  limit?: number
) {
  const query: Record<string, unknown> = {};
  if (status) {
    query.status = status;
  }
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException(ERR_INVALID_DATE_FORMAT);
    }
    query.startTime = { $gte: start, $lte: end };
  }
  const searchMeta = buildAppointmentSearchQuery(search);
  Object.assign(query, searchMeta.query);

  if (page && limit) {
    const total = await appointmentModel.countDocuments(query);
    const baseQuery = appointmentModel.find(query);
    if (searchMeta.useTextScore) {
      baseQuery.select({ score: { $meta: TEXT_SCORE } });
      baseQuery.sort({ score: { $meta: TEXT_SCORE }, startTime: -1 });
    } else {
      baseQuery.sort({ startTime: -1 });
    }
    const items = await baseQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return { items, total, page, limit };
  }

  const baseQuery = appointmentModel.find(query);
  return applyTextSearchSort(baseQuery, searchMeta.useTextScore, { startTime: -1 }).lean();
}
