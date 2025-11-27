"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function TrackerForm({
  projectId,
  tracker,
}: {
  projectId: string;
  tracker?: {
    id: string;
    name: string;
    description: string;
    percentCompleted: number;
  };
}) {
  const [form, setForm] = useState({
    name: tracker?.name ?? "",
    description: tracker?.description ?? "",
    percentCompleted: tracker?.percentCompleted ?? 0,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    await fetch(`/api/projects/${projectId}/trackers/${tracker?.id ?? "new"}`, {
      method: tracker ? "PUT" : "POST",
      body: JSON.stringify(form),
    });
  }

  return (
    <div className="space-y-4">
      <Input
        name="name"
        value={form.name}
        placeholder="Tracker name"
        onChange={handleChange}
      />

      <Textarea
        name="description"
        value={form.description}
        placeholder="Description"
        onChange={handleChange}
      />

      <Input
        name="percentCompleted"
        type="number"
        value={form.percentCompleted}
        onChange={handleChange}
      />

      <Button onClick={handleSubmit}>Save</Button>
    </div>
  );
}
