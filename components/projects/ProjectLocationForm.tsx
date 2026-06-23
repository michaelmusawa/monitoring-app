"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, CheckCircle2, Navigation } from "lucide-react";
import { toast } from "sonner";
import LocationUnitSelector from "@/components/admin/LocationUnitSelector";
import { fetchLocationUnitById } from "@/lib/actions/locationActions";

interface LocationFormProps {
  initialData?: {
    locationUnitId?: string | null;
    lat?: number | null;
    long?: number | null;
  };
  onSave: (data: {
    locationUnitId: string;
    lat: number;
    long: number;
  }) => Promise<void> | void;
}

// ─── Leaflet Map (fixed to work when lat/lng are provided initially) ─────────
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
  const [mapReady, setMapReady] = useState(false);

  // Initialise map only once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

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

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        onMove(
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6)),
        );
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // only once

  // Update view when lat/lng change (after map is ready)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !markerRef.current) return;
    if (isNaN(lat) || isNaN(lng)) return;
    mapRef.current.flyTo([lat, lng], 14, { duration: 0.8 });
    markerRef.current.setLatLng([lat, lng]);
    markerRef.current
      .getPopup()
      ?.setContent(`<b>${label}</b><br/>Drag to adjust`);
  }, [lat, lng, label, mapReady]);

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

// ─── Main component (fixed pre‑loading) ─────────────────────────────────────
export function ProjectLocationForm({
  initialData,
  onSave,
}: LocationFormProps) {
  const [locationUnitId, setLocationUnitId] = useState(
    initialData?.locationUnitId ?? "",
  );
  const [lat, setLat] = useState(
    initialData?.lat != null ? String(initialData.lat) : "",
  );
  const [lng, setLng] = useState(
    initialData?.long != null ? String(initialData.long) : "",
  );
  const [locationUnitName, setLocationUnitName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(
    !!(initialData?.locationUnitId && initialData?.lat && initialData?.long),
  );
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadUnitCoordinates = useCallback(
    async (unitId: string, forceFill = false) => {
      try {
        const unit = await fetchLocationUnitById(unitId);
        if (unit) {
          setLocationUnitName(unit.name);
          if (forceFill && unit.lat && unit.long) {
            setLat(String(unit.lat));
            setLng(String(unit.long));
          } else if (!unit.lat || !unit.long) {
            toast.info(
              "This location has no default coordinates. You can set them manually.",
            );
          }
        }
      } catch {
        toast.error("Failed to load location details");
      }
    },
    [],
  );

  // On initial mount: if we have a locationUnitId, load its name
  // and optionally fill coordinates if they are not already provided
  useEffect(() => {
    if (initialData?.locationUnitId && !initialLoadDone) {
      const hasCoords = initialData.lat != null && initialData.long != null;
      if (hasCoords) {
        // Just fetch the name
        fetchLocationUnitById(initialData.locationUnitId).then((unit) => {
          if (unit) setLocationUnitName(unit.name);
        });
      } else {
        // No coordinates, try to get them from the location unit
        loadUnitCoordinates(initialData.locationUnitId, true);
      }
      setInitialLoadDone(true);
    }
  }, [initialData, initialLoadDone, loadUnitCoordinates]);

  const handleLocationUnitChange = useCallback(
    async (unitId: string) => {
      setLocationUnitId(unitId);
      setSaved(false);
      setLocationUnitName("");

      if (unitId) {
        await loadUnitCoordinates(unitId, true);
      } else {
        setLat("");
        setLng("");
      }
    },
    [loadUnitCoordinates],
  );

  const handleMapMove = useCallback((newLat: number, newLng: number) => {
    setLat(String(newLat));
    setLng(String(newLng));
    setSaved(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationUnitId) {
      toast.error("Please select a location.");
      return;
    }
    if (!lat || !lng) {
      toast.error("Coordinates are missing.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        locationUnitId,
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

  const hasValidCoords =
    lat !== "" &&
    lng !== "" &&
    !isNaN(parseFloat(lat)) &&
    !isNaN(parseFloat(lng));
  const isComplete = !!locationUnitId && hasValidCoords;
  const isDirty =
    locationUnitId !== (initialData?.locationUnitId ?? "") ||
    lat !== (initialData?.lat != null ? String(initialData.lat) : "") ||
    lng !== (initialData?.long != null ? String(initialData.long) : "");

  const mapLabel =
    locationUnitName || (locationUnitId ? "Selected location" : "Location");

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Location <span className="text-destructive">*</span>
        </Label>
        <LocationUnitSelector
          value={locationUnitId}
          onChange={handleLocationUnitChange}
          placeholder="Select a location (ward, sub-county, etc.)"
        />
        <p className="text-xs text-muted-foreground">
          Select a location unit. If coordinates are pre‑defined, they will be
          auto‑filled.
        </p>
      </div>

      {locationUnitId && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
            Coordinates
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (required for map view – edit manually)
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
                placeholder="e.g., -1.286389"
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
                placeholder="e.g., 36.817223"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag the map pin or enter coordinates manually. Both are required.
          </p>
        </div>
      )}

      {hasValidCoords && (
        <LocationMap
          lat={parseFloat(lat)}
          lng={parseFloat(lng)}
          label={mapLabel}
          onMove={handleMapMove}
        />
      )}

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
