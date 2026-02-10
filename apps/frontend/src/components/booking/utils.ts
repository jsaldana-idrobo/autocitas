export const DEFAULT_TIMEZONE = "America/Bogota";
export const PHONE_MIN_LEN = 7;
export const LABEL_PHONE = "Telefono";
export const INPUT_CLASS = "rounded-xl border border-slate-200 px-3 py-2";
export const DISABLED_OPACITY = "opacity-60";
const COUNTRY_CODE_CO = "57";

export function getTodayInTimezone(timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}

export function toDateTimeLocalValue(iso: string, timezone: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}`;
}

export function formatTime(iso: string, timezone: string) {
  const raw = new Date(iso).toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const cleaned = raw.replaceAll(".", "").trim();
  const lower = cleaned.toLowerCase();
  if (lower.endsWith("am")) {
    return `${lower.slice(0, -2).trim()} am`;
  }
  if (lower.endsWith("pm")) {
    return `${lower.slice(0, -2).trim()} pm`;
  }
  return lower;
}

export function formatDateTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function normalizePhone(value: string) {
  return value.replaceAll(/\s+/g, "").replaceAll(/[^\d+]/g, "");
}

export function normalizePhoneToE164(value: string) {
  const compact = normalizePhone(value);
  if (!compact) {
    return "";
  }

  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replaceAll(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digitsOnly = compact.replaceAll(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }

  if (digitsOnly.startsWith(COUNTRY_CODE_CO)) {
    return `+${digitsOnly}`;
  }

  return `+${COUNTRY_CODE_CO}${digitsOnly}`;
}

export function phoneForDisplay(value: string) {
  const normalized = normalizePhoneToE164(value);
  if (normalized.startsWith(`+${COUNTRY_CODE_CO}`)) {
    return normalized.slice(3);
  }
  return normalized || normalizePhone(value);
}
