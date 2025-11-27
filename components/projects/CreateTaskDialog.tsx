"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTaskDialog({
  showCreateTask,
  setShowCreateTask,
  onCreateTask,
}: any) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title) return;
    onCreateTask({ title, status: "TODO" });
    setTitle("");
  };

  return (
    <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Task Title</Label>
            <Input
              placeholder="Enter task name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
