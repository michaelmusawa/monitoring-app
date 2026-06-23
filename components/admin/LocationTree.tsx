"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createLocationUnit,
  updateLocationUnit,
  deleteLocationUnit,
  fetchLocationUnitsForSelect,
  type LocationUnit,
} from "@/lib/actions/locationActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocationTree({
  initialTree,
}: {
  initialTree: LocationUnit[];
}) {
  const [tree, setTree] = useState(initialTree);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<LocationUnit | null>(null);
  const [form, setForm] = useState({
    name: "",
    level: "",
    parentId: "",
    code: "",
    description: "",
    displayOrder: 0,
    lat: "", // new
    long: "", // new
  });
  const [parentOptions, setParentOptions] = useState<
    { id: string; name: string; level: string }[]
  >([]);

  const openCreate = async (parent?: LocationUnit) => {
    setEditingUnit(null);
    setForm({
      name: "",
      level: "",
      parentId: parent?.id || "",
      code: "",
      description: "",
      displayOrder: 0,
      lat: "",
      long: "",
    });
    const allUnits = await fetchLocationUnitsForSelect();
    setParentOptions(allUnits);
    setModalOpen(true);
  };

  const openEdit = (unit: LocationUnit) => {
    setEditingUnit(unit);
    setForm({
      name: unit.name,
      level: unit.level,
      parentId: unit.parentId || "",
      code: unit.code || "",
      description: unit.description || "",
      displayOrder: unit.displayOrder,
      lat: unit.lat?.toString() ?? "", // new
      long: unit.long?.toString() ?? "", // new
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.level.trim()) {
      toast.error("Level is required (e.g., County, Sub-county)");
      return;
    }
    startTransition(async () => {
      try {
        if (editingUnit) {
          await updateLocationUnit(editingUnit.id, {
            name: form.name,
            level: form.level,
            parentId: form.parentId || null,
            code: form.code || undefined,
            description: form.description || undefined,
            displayOrder: form.displayOrder,
            lat: form.lat ? parseFloat(form.lat) : null,
            long: form.long ? parseFloat(form.long) : null,
          });
          toast.success("Location updated");
        } else {
          await createLocationUnit({
            name: form.name,
            level: form.level,
            parentId: form.parentId || null,
            code: form.code || undefined,
            description: form.description || undefined,
            displayOrder: form.displayOrder,
            lat: form.lat ? parseFloat(form.lat) : null,
            long: form.long ? parseFloat(form.long) : null,
          });
          toast.success("Location created");
        }
        setModalOpen(false);
        const res = await fetch("/api/admin/locations/tree");
        const newTree = await res.json();
        setTree(newTree);
      } catch (err: any) {
        toast.error(err.message || "Operation failed");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location? It must have no child locations."))
      return;
    startTransition(async () => {
      try {
        await deleteLocationUnit(id);
        toast.success("Location deleted");
        const res = await fetch("/api/admin/locations/tree");
        const newTree = await res.json();
        setTree(newTree);
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderTree = (nodes: LocationUnit[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expanded.has(node.id);
      return (
        <div key={node.id} style={{ marginLeft: depth * 24 }}>
          <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded-lg group">
            <button
              onClick={() => hasChildren && toggleExpand(node.id)}
              className="shrink-0 w-5 h-5 flex items-center justify-center"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : (
                <span className="w-5" />
              )}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium text-sm">{node.name}</span>
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                {node.level}
              </span>
              {node.code && (
                <span className="text-xs text-muted-foreground">
                  ({node.code})
                </span>
              )}
            </div>
            <div className="hidden group-hover:flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openEdit(node)}
              >
                <Pencil size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDelete(node.id)}
              >
                <Trash2 size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => openCreate(node)}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">{renderTree(node.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Location Tree</h2>
          <Button size="sm" variant="outline" onClick={() => openCreate()}>
            <Plus size={14} className="mr-1" /> Add Root Location
          </Button>
        </div>
        {tree.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No locations yet. Click "Add Root Location" to create.
          </p>
        ) : (
          <div className="space-y-1">{renderTree(tree)}</div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Location" : "Add New Location"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Level *</Label>
              <Input
                placeholder="e.g. County, Sub-county, Ward, Village"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Define the type (free text)
              </p>
            </div>
            <div>
              <Label>Parent Location</Label>
              <Select
                value={form.parentId || "__none__"}
                onValueChange={(val) =>
                  setForm({ ...form, parentId: val === "__none__" ? "" : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {parentOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name} ({opt.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Code (optional)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Latitude (optional)</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. -1.286389"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default map centre for this location
              </p>
            </div>
            <div>
              <Label>Longitude (optional)</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 36.817223"
                value={form.long}
                onChange={(e) => setForm({ ...form, long: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
