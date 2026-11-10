export type Role = "admin" | "simple";

export type Profile = { id: string; name: string; role: Role };

export type Client = {
  id: string;
  name: string;
  firm: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  type: string | null;
  stage: string | null;
  discussed_summary: string | null;
  next_to_discuss: string | null;
  pending_from_client: string | null;
  pending_from_us: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
};

export type Requirement = {
  id: string;
  client_id: string;
  product_text: string;
  quantity: number | null;
  notes: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  status: "todo" | "doing" | "done";
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  owner_profile?: { name: string } | null;
  client?: { id: string; name: string } | null;
};

/** Result shape for every server action used with useActionState. */
export type Duplicate = { id: string; name: string; firm: string | null; phone: string | null };

export type ActionState = { ok: boolean; error?: string; message?: string; duplicate?: Duplicate } | null;

export type ItemKind = "ordered" | "to_send" | "sent" | "received";

export type ClientItem = {
  id: string;
  client_id: string;
  kind: ItemKind;
  description: string;
  quantity: number | null;
  item_date: string | null;
  notes: string | null;
  created_at: string;
  author?: { name: string } | null;
};
