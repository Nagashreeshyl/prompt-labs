"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";

export function CollectionDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: { id: string; name: string; description: string };
  onSaved: (id: string) => void;
}) {
  const { createCollection, renameCollection, toast, reportError } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      loading={busy}
      title={isEdit ? "Edit collection" : "New collection"}
      description={isEdit ? undefined : "Collections are private groupings inside your library. Prompts keep working individually."}
      confirmLabel={isEdit ? "Save" : "Create collection"}
      onConfirm={async () => {
        if (!name.trim()) {
          setError("Collection name is required.");
          return;
        }
        setBusy(true);
        setError(undefined);
        try {
          if (isEdit && initial) {
            await renameCollection(initial.id, name, description);
            toast("Collection updated");
            onSaved(initial.id);
          } else {
            const id = await createCollection(name, description);
            toast("Collection created", { action: { label: "Open", onClick: () => onSaved(id) } });
            onSaved(id);
          }
          onClose();
        } catch (err) {
          reportError(err);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="col-name">Name</Label>
          <Input id="col-name" value={name} onChange={(e) => setName(e.target.value)} error={error} placeholder="e.g. Client work" autoFocus />
        </div>
        <div>
          <Label htmlFor="col-desc" hint="optional">
            Description
          </Label>
          <Textarea id="col-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What lives in this collection?" />
        </div>
      </div>
    </ConfirmDialog>
  );
}

