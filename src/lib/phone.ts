/** Digits only. */
export const digits = (phone: string) => phone.replace(/\D/g, "");

/** tel: link target, keeping a leading +. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** WhatsApp link for a Pakistani number: 0300… → 92300…; already-international numbers kept. */
export function whatsappHref(phone: string): string | null {
  let d = digits(phone);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  else if (d.length === 10 && d.startsWith("3")) d = "92" + d;
  return d.length >= 11 ? `https://wa.me/${d}` : null;
}

/** Last 10 digits, for duplicate matching across 0300… / +92300… formats. */
export const phoneKey = (phone: string | null | undefined) => (phone ? digits(phone).slice(-10) : "");
