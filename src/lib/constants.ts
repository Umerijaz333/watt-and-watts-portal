export const STAGES = [
  { value: "first_contact", label: "First contact" },
  { value: "meeting_done", label: "Meeting done" },
  { value: "quotation_sent", label: "Quotation sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "order_placed", label: "Order placed" },
  { value: "lost", label: "Lost" },
] as const;

export const CLIENT_TYPES = [
  { value: "architect", label: "Architect" },
  { value: "builder", label: "Builder" },
  { value: "interior_designer", label: "Interior designer" },
  { value: "end_client", label: "End client" },
  { value: "other", label: "Other" },
] as const;

export const TASK_STATUSES = [
  { value: "todo", label: "To do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
] as const;

export function stageLabel(v: string | null | undefined) {
  return STAGES.find((s) => s.value === v)?.label ?? "—";
}
export function typeLabel(v: string | null | undefined) {
  return CLIENT_TYPES.find((s) => s.value === v)?.label ?? "—";
}

export const PHOTO_BUCKET = "note-photos";

/** Orders, sent & received: the four kinds of entry, in display order. */
export const ITEM_KINDS = [
  { value: "ordered", label: "Ordered by client", short: "Ordered", hint: "What they have confirmed they are buying", pill: "bg-navy text-white" },
  { value: "to_send", label: "To send", short: "To send", hint: "What we are going to send them", pill: "bg-tint text-due" },
  { value: "sent", label: "Sent", short: "Sent", hint: "What we have already sent", pill: "bg-done-tint text-done" },
  { value: "received", label: "Received from client", short: "Received", hint: "Drawings, payment, returned items…", pill: "bg-[#e6e8ec] text-[#3c4250]" },
] as const;
