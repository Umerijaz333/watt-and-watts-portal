/** Single-colour line icons (currentColor) — replaces emoji, which render in off-brand colours. */
type P = { size?: number; className?: string };
const base = (size: number, className: string) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className, "aria-hidden": true,
});
export const NoteIcon = ({ size = 24, className = "" }: P) => (
  <svg {...base(size, className)}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
);
export const CameraIcon = ({ size = 24, className = "" }: P) => (
  <svg {...base(size, className)}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
);
export const CalendarIcon = ({ size = 24, className = "" }: P) => (
  <svg {...base(size, className)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 15h2" /></svg>
);
export const PhoneIcon = ({ size = 24, className = "" }: P) => (
  <svg {...base(size, className)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
export const CheckIcon = ({ size = 24, className = "" }: P) => (
  <svg {...base(size, className)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
