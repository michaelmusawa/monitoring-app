"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LocationFormProps {
  initialData?: {
    subCounty?: string | null;
    ward?: string | null;
    lat?: number | null;
    long?: number | null;
  };
  onSave: (data: {
    subCounty: string;
    ward: string;
    lat: number;
    long: number;
  }) => Promise<void>;
}

export function ProjectLocationForm({
  initialData,
  onSave,
}: LocationFormProps) {
  const [subCounty, setSubCounty] = useState(initialData?.subCounty || "");
  const [ward, setWard] = useState(initialData?.ward || "");
  const [lat, setLat] = useState(initialData?.lat?.toString() || "");
  const [lng, setLng] = useState(initialData?.long?.toString() || "");
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGeocode = async () => {
    if (!subCounty || !ward) {
      toast.error("Please enter both sub‑county and ward");
      return;
    }
    setGeocoding(true);
    try {
      const query = `${ward}, ${subCounty}, Kenya`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        toast.success("Coordinates found");
      } else {
        toast.error("Location not found. Please enter coordinates manually.");
      }
    } catch {
      toast.error("Geocoding failed");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCounty || !ward || !lat || !lng) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        subCounty,
        ward,
        lat: parseFloat(lat),
        long: parseFloat(lng),
      });
      toast.success("Location saved");
    } catch {
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    subCounty !== (initialData?.subCounty || "") ||
    ward !== (initialData?.ward || "") ||
    lat !== (initialData?.lat?.toString() || "") ||
    lng !== (initialData?.long?.toString() || "");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subCounty">Sub‑County</Label>
          <Input
            id="subCounty"
            value={subCounty}
            onChange={(e) => setSubCounty(e.target.value)}
            placeholder="e.g. Kasarani"
            required
          />
        </div>
        <div>
          <Label htmlFor="ward">Ward</Label>
          <Input
            id="ward"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="e.g. Ruaraka"
            required
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGeocode}
        disabled={geocoding}
      >
        {geocoding ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 mr-2" />
        )}
        Get Coordinates
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-1.2921"
            required
          />
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="36.8219"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? "Saving..." : "Save Location"}
        </Button>
      </div>
    </form>
  );
}
