"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, CheckCircle2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { NAIROBI_SUB_COUNTIES, getWards, getWardCoords } from "@/lib/data/data";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  }) => Promise<void> | void;
}

// ─── Leaflet Map (lazy-loaded, SSR-safe) ──────────────────────────────────────

function LocationMap({
  lat,
  lng,
  label,
  onMove,
}: {
  lat: number;
  lng: number;
  label: string;
  onMove: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Boot Leaflet once on mount (dynamic import — no SSR issues)
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      // Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Fix default icon paths (broken in webpack)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([lat, lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.bindPopup(`<b>${label}</b><br/>Drag to adjust`).openPopup();

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMove(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });

      // Also allow clicking the map to move the marker
      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        onMove(
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6)),
        );
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only mount once

  // When lat/lng props change externally (new ward selected), fly the map there
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo([lat, lng], 14, { duration: 0.8 });
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current
      .getPopup()
      ?.setContent(`<b>${label}</b><br/>Drag to adjust`);
  }, [lat, lng, label]);

  return (
    <div
      className="rounded-lg overflow-hidden border bg-muted/20"
      style={{ isolation: "isolate" }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="flex-1 truncate font-medium text-foreground">
          {label}
        </span>
        <span className="text-muted-foreground">
          Drag pin or click map to adjust
        </span>
      </div>
      <div ref={containerRef} style={{ height: 220, zIndex: 0 }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectLocationForm({
  initialData,
  onSave,
}: LocationFormProps) {
  const [subCounty, setSubCounty] = useState(initialData?.subCounty ?? "");
  const [ward, setWard] = useState(initialData?.ward ?? "");
  const [lat, setLat] = useState(
    initialData?.lat != null ? String(initialData.lat) : "",
  );
  const [lng, setLng] = useState(
    initialData?.long != null ? String(initialData.long) : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(
    !!(
      initialData?.subCounty &&
      initialData?.ward &&
      initialData?.lat &&
      initialData?.long
    ),
  );

  const availableWards = subCounty ? getWards(subCounty) : [];

  // ── Sub-county change ───────────────────────────────────────────────────────
  const handleSubCountyChange = (val: string) => {
    setSubCounty(val);
    setWard("");
    setLat("");
    setLng("");
    setSaved(false);
    // Do NOT set coordinates here — wait for the user to select a ward
  };

  // ── Ward change — instant coordinates from data ─────────────────────────────
  const handleWardChange = (val: string) => {
    setWard(val);
    setSaved(false);
    const coords = getWardCoords(subCounty, val);
    if (coords) {
      setLat(String(coords.lat));
      setLng(String(coords.lng));
    }
  };

  // ── Map pin dragged / clicked ───────────────────────────────────────────────
  const handleMapMove = useCallback((newLat: number, newLng: number) => {
    setLat(String(newLat));
    setLng(String(newLng));
    setSaved(false);
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCounty || !ward) {
      toast.error("Please select a sub-county and ward.");
      return;
    }
    if (!lat || !lng) {
      toast.error("Coordinates are missing.");
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
      setSaved(true);
    } catch {
      toast.error("Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = lat !== "" && lng !== "";
  const isComplete = !!(subCounty && ward && hasCoords);
  const isDirty =
    subCounty !== (initialData?.subCounty ?? "") ||
    ward !== (initialData?.ward ?? "") ||
    lat !== (initialData?.lat != null ? String(initialData.lat) : "") ||
    lng !== (initialData?.long != null ? String(initialData.long) : "");

  const mapLabel =
    ward && subCounty ? `${ward}, ${subCounty}` : subCounty || "Nairobi";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Sub-county ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Sub-County <span className="text-destructive">*</span>
        </Label>
        <Select value={subCounty} onValueChange={handleSubCountyChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select a sub-county…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">
                Nairobi City County — 17 Sub-Counties
              </SelectLabel>
              {NAIROBI_SUB_COUNTIES.map((sc) => (
                <SelectItem key={sc.name} value={sc.name} className="text-sm">
                  {sc.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* ── Ward ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Ward <span className="text-destructive">*</span>
        </Label>
        <Select
          value={ward}
          onValueChange={handleWardChange}
          disabled={!subCounty}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue
              placeholder={
                subCounty
                  ? `${availableWards.length} wards — select one…`
                  : "Select a sub-county first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">
                {subCounty} — Wards
              </SelectLabel>
              {availableWards.map((w) => (
                <SelectItem key={w.name} value={w.name} className="text-sm">
                  {w.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {subCounty && !ward && (
          <p className="text-xs text-muted-foreground">
            Map will centre on the ward automatically.
          </p>
        )}
      </div>

      {/* ── Interactive map ── */}
      {ward && hasCoords && (
        <LocationMap
          lat={parseFloat(lat)}
          lng={parseFloat(lng)}
          label={mapLabel}
          onMove={handleMapMove}
        />
      )}

      {/* ── Coordinate inputs (fine-tune) ── */}
      {ward && hasCoords && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
            Coordinates
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (auto-filled — edit manually if needed)
            </span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="lat"
                className="text-[11px] text-muted-foreground"
              >
                Latitude
              </Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value);
                  setSaved(false);
                }}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="lng"
                className="text-[11px] text-muted-foreground"
              >
                Longitude
              </Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => {
                  setLng(e.target.value);
                  setSaved(false);
                }}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div className="flex items-center justify-between pt-1">
        {saved && !isDirty ? (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Location saved
          </div>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          size="sm"
          disabled={saving || !isComplete || (!isDirty && saved)}
          className="min-w-[130px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Saving…
            </>
          ) : saved && !isDirty ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
              Saved
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 mr-2" />
              Save Location
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
