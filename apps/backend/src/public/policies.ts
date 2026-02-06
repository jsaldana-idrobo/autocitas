import { DateTime } from "luxon";
import { BadRequestException } from "@nestjs/common";
import { Business } from "../schemas/business.schema.js";

export function assertSameDayAllowed(dateLocal: DateTime, business: Business) {
  const allowSameDay = business.policies?.allowSameDay ?? true;
  if (!allowSameDay) {
    const now = DateTime.now().setZone(business.timezone || "America/Bogota");
    if (dateLocal.hasSame(now, "day")) {
      throw new BadRequestException("Same-day bookings are not allowed.");
    }
  }
}

export function assertNotInPast(dateLocal: DateTime, business: Business) {
  const now = DateTime.now().setZone(business.timezone || "America/Bogota");
  if (dateLocal < now.startOf("day")) {
    throw new BadRequestException("Date must be today or in the future.");
  }
}
