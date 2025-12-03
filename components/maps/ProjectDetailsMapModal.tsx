"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import ProjectDetailsCard from "@/components/projects/ProjectDetailsCard";

interface ProjectDetailsMapModalProps {
  project: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsMapModal({
  project,
  open,
  onOpenChange,
}: ProjectDetailsMapModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.name}</DialogTitle>
          <DialogDescription>{project.code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <ProjectDetailsCard
            project={project}
            onClose={() => onOpenChange(false)}
            showActions={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
