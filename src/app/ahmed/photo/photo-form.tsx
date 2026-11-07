"use client";

import { useState } from "react";
import { ClientPicker, type ClientOption } from "@/components/client-picker";
import { PhotoUpload } from "@/components/photo-upload";
import { DoneScreen } from "../done-screen";

export function AhmedPhotoForm({ clients, initialClientId }: { clients: ClientOption[]; initialClientId: string | null }) {
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [saved, setSaved] = useState(false);

  if (saved) return <DoneScreen title="Photo saved" again={{ href: "/ahmed/photo", label: "Add another photo" }} />;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xl font-bold">1. Client</legend>
        <ClientPicker clients={clients} value={clientId} onChange={setClientId} />
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xl font-bold">2. Photo</legend>
        <PhotoUpload clientId={clientId} large onSaved={() => setSaved(true)} />
      </fieldset>
    </div>
  );
}
