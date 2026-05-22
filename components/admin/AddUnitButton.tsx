// components/admin/AddUnitButton.tsx (simplified)
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AddUnitButton() {
  const [open, setOpen] = useState(false);
  // ... reuse modal logic or combine with OrganisationTree
  return (
    <Button onClick={() => setOpen(true)}>
      <Plus className="mr-2" size={16} /> Add Unit
    </Button>
  );
}
