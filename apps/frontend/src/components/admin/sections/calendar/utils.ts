import { servicePalette, START_HOUR } from "./constants";

export function minutesFromStart(date: Date) {
  return date.getHours() * 60 + date.getMinutes() - START_HOUR * 60;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function isSameDay(iso: string, day: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayStr = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayStr}` === day;
}

export function getServiceColor(serviceId: string) {
  const index = Math.abs(
    serviceId.split("").reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0)
  );
  return servicePalette[index % servicePalette.length];
}
