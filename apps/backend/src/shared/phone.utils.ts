const COUNTRY_CODE_CO = "57";

export function normalizePhoneToE164(value: string) {
  const compact = value
    .trim()
    .replaceAll(/\s+/g, "")
    .replaceAll(/[^\d+]/g, "");
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
