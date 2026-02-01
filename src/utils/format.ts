export function fmtMoney(v: any): string {
  const num = Number(v);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(v: any, locale: string = "ar-IQ"): string {
  if (!v) return "—";
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toLocaleDateString(locale);
  if (typeof v === "string") {
    const parts = String(v).split("T");
    return parts[0] ?? String(v);
  }
  return String(v);
}

export function fmtTime(
  v: any,
  fallbackFrom?: any,
  locale: string = "ar-IQ"
): string {
  if (v) return String(v).split("T")[1]?.slice(0, 8) || String(v);
  const d = new Date(fallbackFrom);
  if (!isNaN(d.getTime()))
    return d.toLocaleTimeString(locale, { hour12: false });
  return "";
}


