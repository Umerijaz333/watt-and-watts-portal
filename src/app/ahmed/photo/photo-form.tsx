"use client";

import { useState } from "react";
import { ClientPicker, type ClientOption } from "@/components/client-picker";
import { PhotoUpload } from "@/components/photo-upload";
import { DoneScreen } from "../done-screen";

export function AhmedPhotoForm({ clients, initialClientId }: { clients: ClientOption[]; initialClientId: string | null }) {
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [saved, setSaved] = useState(false);
  const [clientName, setClientName] = useState<string | null>(clients.find((c) => c.id === initialClientId)?.name ?? null);

  if (saved)
    return (
      <DoneScreen
        title="Done! Photo saved"
        detail={clientName ? `Saved for ${clientName}. Umer will see it on their page.` : undefined}
        again={{ href: "/ahmed/photo", label: "Add another photo" }}
      />
    );

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xl font-bold text-navy">1. Who is this for?</legend>
        <ClientPicker clients={clients} value={clientId} onChange={(id, name) => { setClientId(id); setClientName(name ?? null); }} />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xl font-bold text-navy">2. Take a photo of your notes</legend>
        <PhotoUpload clientId={clientId} large onSaved={() => setSaved(true)} />
      </fieldset>
    </div>
  );
}
