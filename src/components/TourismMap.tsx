import { useEffect, useRef } from "react";
import "./map.css";
import { useTourismZones } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";

// Status color map (CSS color strings for Leaflet)
const statusColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  moderate: "#3b82f6",
  low: "#22c55e",
};

const statusLabel: Record<string, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

const TourismMap = () => {
  const { data: zones, isLoading } = useTourismZones();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!zones || zones.length === 0 || !mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Destroy existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Dark tile layer matching dashboard theme
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Add congestion circles + markers for each zone
      zones.forEach((zone) => {
        const color = statusColor[zone.status] ?? statusColor.low;
        const radius = 30000 + (zone.density_percent / 100) * 250000;

        // Pulsing circle for congestion
        L.circle([zone.latitude, zone.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5,
          opacity: 0.6,
          radius,
        }).addTo(map);

        // Custom HTML marker
        const markerIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${color};
              width: 12px;
              height: 12px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 8px ${color};
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([zone.latitude, zone.longitude], {
          icon: markerIcon,
        }).addTo(map);

        marker.bindPopup(
          `<div style="
            background: #1a1a2e;
            color: #e2e8f0;
            padding: 12px 14px;
            border-radius: 8px;
            font-family: system-ui, sans-serif;
            min-width: 200px;
            border: 1px solid ${color}40;
          ">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">${zone.name}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#94a3b8; font-size:12px;">Congestion</span>
              <span style="color:${color}; font-weight:600; font-size:12px;">${zone.density_percent}%</span>
            </div>
            <div style="background:#334155; border-radius:4px; height:6px; margin-bottom:8px;">
              <div style="background:${color}; height:100%; border-radius:4px; width:${zone.density_percent}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span style="color:#94a3b8; font-size:12px;">Eco Score</span>
              <span style="color:#22c55e; font-size:12px;">${zone.eco_score}/100</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#94a3b8; font-size:12px;">Status</span>
              <span style="
                background:${color}22;
                color:${color};
                padding:1px 8px;
                border-radius:4px;
                font-size:11px;
                font-weight:600;
                text-transform:uppercase;
              ">${statusLabel[zone.status] ?? zone.status}</span>
            </div>
          </div>`,
          {
            maxWidth: 240,
            className: "custom-popup",
          }
        );
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [zones]);

  return (
    <div className="glass-card rounded-xl p-6 col-span-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-foreground font-semibold text-lg">Global Tourism Congestion Map</h3>
        <div className="flex items-center gap-3">
          {Object.entries(statusLabel).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: statusColor[key] }}
              />
              <span className="text-muted-foreground text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Live congestion overlay across 20 global tourist destinations — click markers for details
      </p>

      {isLoading ? (
        <Skeleton className="h-[480px] rounded-lg" />
      ) : (
        <div
          ref={mapRef}
          className="rounded-lg overflow-hidden border border-border/40"
          style={{ height: "480px", width: "100%" }}
        />
      )}
    </div>
  );
};

export default TourismMap;
