"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, MapPin, Trash2, Move } from "lucide-react";
import { toast } from "sonner";
import LocationUnitSelector from "@/components/admin/LocationUnitSelector";
import { fetchLocationUnitById } from "@/lib/actions/locationActions";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Leaflet and Draw will be dynamically imported
let L: any;
let Draw: any;

interface GeometryData {
  type: "Point" | "LineString" | "Polygon" | "MultiPoint";
  coordinates: any;
}

interface Props {
  initialData?: {
    locationUnitId?: string | null;
    geometryType?: string | null;
    geometryData?: any | null;
    lat?: number | null;
    long?: number | null;
  };
  onSave: (data: {
    locationUnitId: string;
    geometryType: string;
    geometryData: any;
  }) => Promise<void>;
}

export function ProjectGeometryEditor({ initialData, onSave }: Props) {
  const [locationUnitId, setLocationUnitId] = useState(
    initialData?.locationUnitId ?? "",
  );
  const [geometryType, setGeometryType] = useState<string>(
    initialData?.geometryType ?? "Point",
  );
  const [geometryData, setGeometryData] = useState<any>(null);
  const [locationUnitName, setLocationUnitName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialData?.geometryData);
  const [drawMode, setDrawMode] = useState<
    "none" | "point" | "line" | "polygon"
  >("none");
  const [editing, setEditing] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);

  // Load location unit name
  useEffect(() => {
    if (locationUnitId) {
      fetchLocationUnitById(locationUnitId)
        .then((unit) => unit && setLocationUnitName(unit.name))
        .catch(console.error);
    }
  }, [locationUnitId]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      const leaflet = await import("leaflet");
      const leafletDraw = await import("leaflet-draw");
      L = leaflet;
      Draw = leafletDraw;

      if (cancelled || !mapRef.current) return;

      // Fix Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Create map
      const map = L.map(mapRef.current!).setView([-1.286389, 36.817223], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Add draw control (initially hidden)
      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
          polyline: { shapeOptions: { color: "#3b82f6" } },
          polygon: { shapeOptions: { color: "#10b981" } },
          marker: { shapeOptions: { color: "#f59e0b" } },
          circle: false,
          circlemarker: false,
          rectangle: false,
        },
      });
      drawControlRef.current = drawControl;

      // Feature group to hold drawn items
      const drawnItems = new L.FeatureGroup();
      drawnItemsRef.current = drawnItems;
      map.addLayer(drawnItems);

      // Load existing geometry
      if (initialData?.geometryData) {
        const geoJson = initialData.geometryData;
        const layer = L.geoJSON(geoJson);
        drawnItems.addLayer(layer);
        map.fitBounds(drawnItems.getBounds());
        setGeometryData(geoJson);
      }

      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      cancelled = true;
      leafletMapRef.current?.remove();
    };
  }, []);

  // Handle drawing events
  useEffect(() => {
    if (!leafletMapRef.current || !drawControlRef.current) return;

    const map = leafletMapRef.current;
    const drawControl = drawControlRef.current;

    const onDrawCreated = (e: any) => {
      const { layerType, layer } = e;
      let geoJson: any;
      let type: string;

      if (layerType === "marker") {
        const latlng = layer.getLatLng();
        geoJson = { type: "Point", coordinates: [latlng.lng, latlng.lat] };
        type = "Point";
      } else if (layerType === "polyline") {
        geoJson = layer.toGeoJSON().geometry;
        type = "LineString";
      } else if (layerType === "polygon") {
        geoJson = layer.toGeoJSON().geometry;
        type = "Polygon";
      } else {
        return;
      }

      // Clear previous drawings
      drawnItemsRef.current.clearLayers();
      drawnItemsRef.current.addLayer(layer);
      setGeometryType(type);
      setGeometryData(geoJson);
      setSaved(false);
      setDrawMode("none");
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated);
    };
  }, []);

  // Enable drawing mode
  const startDrawing = (mode: "point" | "line" | "polygon") => {
    if (!leafletMapRef.current || !drawControlRef.current) return;
    setDrawMode(mode);
    let handler: any;
    if (mode === "point") handler = new L.Draw.Marker(leafletMapRef.current);
    else if (mode === "line")
      handler = new L.Draw.Polyline(leafletMapRef.current);
    else if (mode === "polygon")
      handler = new L.Draw.Polygon(leafletMapRef.current);
    handler.enable();
  };

  const clearGeometry = () => {
    drawnItemsRef.current?.clearLayers();
    setGeometryData(null);
    setGeometryType("Point");
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationUnitId) {
      toast.error("Please select a location.");
      return;
    }
    if (!geometryData) {
      toast.error("Please draw the project geometry on the map.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        locationUnitId,
        geometryType,
        geometryData,
      });
      setSaved(true);
    } catch {
      toast.error("Failed to save geometry.");
    } finally {
      setSaving(false);
    }
  };

  const isComplete = !!locationUnitId && !!geometryData;
  const isDirty = !saved && isComplete;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Location Unit <span className="text-destructive">*</span>
        </Label>
        <LocationUnitSelector
          value={locationUnitId}
          onChange={setLocationUnitId}
          placeholder="Select location (ward, sub-county, etc.)"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Project Geometry</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startDrawing("point")}
              disabled={drawMode !== "none"}
              className="h-7 text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" /> Point
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startDrawing("line")}
              disabled={drawMode !== "none"}
              className="h-7 text-xs"
            >
              <Move className="w-3 h-3 mr-1" /> Line
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startDrawing("polygon")}
              disabled={drawMode !== "none"}
              className="h-7 text-xs"
            >
              <Move className="w-3 h-3 mr-1" /> Polygon
            </Button>
            {geometryData && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearGeometry}
                className="h-7 text-xs text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div
          ref={mapRef}
          style={{ height: 400, width: "100%", zIndex: 0 }}
          className="rounded-lg border"
        />
        <p className="text-xs text-muted-foreground">
          Click the buttons to draw a point, line, or polygon on the map. You
          can drag and edit existing shapes.
        </p>
      </div>

      <div className="flex items-center justify-between pt-1">
        {saved && !isDirty ? (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Geometry saved
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
              Save Geometry
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
