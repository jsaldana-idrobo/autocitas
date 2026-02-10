import type { Model } from "mongoose";
import { normalizePhoneToE164 } from "../../shared/phone.utils.js";

export const TEXT_SCORE = "textScore";
const PHONE_SEARCH_REGEX = /^[\d+()\-\s]+$/;

export function normalizePhone(value: string) {
  return normalizePhoneToE164(value);
}

export function applyTextSearchSort<T>(
  query: ReturnType<Model<T>["find"]>,
  hasSearch: boolean,
  fallbackSort: Record<string, 1 | -1>
) {
  if (hasSearch) {
    query.select({ score: { $meta: TEXT_SCORE } });
    query.sort({ score: { $meta: TEXT_SCORE }, ...fallbackSort });
  } else {
    query.sort(fallbackSort);
  }
  return query;
}

export function buildAppointmentSearchQuery(search?: string) {
  const trimmed = search?.trim() ?? "";
  if (!trimmed) {
    return { query: {}, useTextScore: false };
  }
  if (PHONE_SEARCH_REGEX.test(trimmed)) {
    return { query: { customerPhone: normalizePhone(trimmed) }, useTextScore: false };
  }
  return { query: { $text: { $search: trimmed } }, useTextScore: true };
}
