import { stageLabel } from "@/lib/constants";

/** Pipeline stage chips in shades of navy, blue and grey only. */
const STYLES: Record<string, string> = {
  first_contact: "bg-[#eceef2] text-[#3c4250] border-[#d5d9e1]",
  meeting_done: "bg-tint text-link border-tint-strong",
  quotation_sent: "bg-tint-strong text-navy border-[#c3d4ef]",
  negotiating: "bg-btn text-white border-btn",
  order_placed: "bg-navy text-white border-navy",
  lost: "bg-surface text-muted border-line line-through decoration-1",
};

export function StageChip({ stage, className = "" }: { stage: string | null | undefined; className?: string }) {
  const s = stage ?? "first_contact";
  return (
    <span className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[s] ?? STYLES.first_contact} ${className}`}>
      {stageLabel(s)}
    </span>
  );
}
