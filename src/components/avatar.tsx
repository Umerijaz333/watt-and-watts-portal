/** Round initials badge for a person, in soft brand shades (navy / blue / grey). */
const SHADES = [
  "bg-[#dce7f7] text-navy",
  "bg-[#d6e4f5] text-[#0f4f8c]",
  "bg-[#e3e6f2] text-[#2c3f7a]",
  "bg-[#e6e8ec] text-[#3c4250]",
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${SHADES[h % SHADES.length]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
