import { useEffect, useRef, useState, useMemo } from "react";
import "./map.css";
import { useTourismZones } from "@/hooks/useTourismData";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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

// Derive country from zone name (simple mapping)
const getCountry = (name: string): string => {
  const map: Record<string, string> = {
    "Eiffel Tower": "France",
    "Louvre Museum": "France",
    "Taj Mahal": "India",
    "Great Wall of China": "China",
    "Machu Picchu": "Peru",
    "Colosseum": "Italy",
    "Venice Canals": "Italy",
    "Santorini": "Greece",
    "Angkor Wat": "Cambodia",
    "Bali": "Indonesia",
    "Tokyo": "Japan",
    "Kyoto": "Japan",
    "Barcelona": "Spain",
    "Amsterdam": "Netherlands",
    "New York": "USA",
    "Grand Canyon": "USA",
    "Sydney Opera House": "Australia",
    "Petra": "Jordan",
    "Serengeti": "Tanzania",
    "Maldives": "Maldives",
  };
  return map[name] ?? "Other";
};

type StatusFilter = Record<string, boolean>;

const TourismMap = () => {
  const { data: zones, isLoading, dataUpdatedAt } = useTourismZones();
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({
    critical: true,
    high: true,
    moderate: true,
    low: true,
  });
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [minEcoScore, setMinEcoScore] = useState(0);

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt).toLocaleTimeString());
    }
  }, [dataUpdatedAt]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Derive unique countries from data
  const allCountries = useMemo(() => {
    if (!zones) return [];
    return Array.from(new Set(zones.map((z) => getCountry(z.name)))).sort();
  }, [zones]);

  // Init selected countries once data loads
  useEffect(() => {
    if (allCountries.length > 0 && selectedCountries.size === 0) {
      setSelectedCountries(new Set(allCountries));
    }
  }, [allCountries]);

  // Filtered zones
  const filteredZones = useMemo(() => {
    if (!zones) return [];
    return zones.filter((z) => {
      if (!statusFilter[z.status]) return false;
      if (!selectedCountries.has(getCountry(z.name))) return false;
      if (z.eco_score < minEcoScore) return false;
      return true;
    });
  }, [zones, statusFilter, selectedCountries, minEcoScore]);

  useEffect(() => {
    if (!zones || zones.length === 0 || !mapRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

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

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      filteredZones.forEach((zone) => {
        const color = statusColor[zone.status] ?? statusColor.low;
        const radius = 30000 + (zone.density_percent / 100) * 250000;

        L.circle([zone.latitude, zone.longitude], {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5,
          opacity: 0.6,
          radius,
        }).addTo(map);

        const markerIcon = L.divIcon({
          className: "",
          html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${color};"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([zone.latitude, zone.longitude], { icon: markerIcon }).addTo(map);

        marker.bindPopup(
          `<div style="background:#1a1a2e;color:#e2e8f0;padding:12px 14px;border-radius:8px;font-family:system-ui,sans-serif;min-width:200px;border:1px solid ${color}40;">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${zone.name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-bottom:8px;">${getCountry(zone.name)}</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#94a3b8;font-size:12px;">Congestion</span>
              <span style="color:${color};font-weight:600;font-size:12px;">${zone.density_percent}%</span>
            </div>
            <div style="background:#334155;border-radius:4px;height:6px;margin-bottom:8px;">
              <div style="background:${color};height:100%;border-radius:4px;width:${zone.density_percent}%;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
              <span style="color:#94a3b8;font-size:12px;">Eco Score</span>
              <span style="color:#22c55e;font-size:12px;">${zone.eco_score}/100</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#94a3b8;font-size:12px;">Status</span>
              <span style="background:${color}22;color:${color};padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;">${statusLabel[zone.status] ?? zone.status}</span>
            </div>
          </div>`,
          { maxWidth: 240, className: "custom-popup" }
        );
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filteredZones]);

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  const activeFiltersCount =
    Object.values(statusFilter).filter((v) => !v).length +
    (allCountries.length - selectedCountries.size) +
    (minEcoScore > 0 ? 1 : 0);

  return (
    <div className="glass-card rounded-xl p-6 col-span-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-foreground font-semibold text-lg">Global Tourism Congestion Map</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[hsl(var(--chart-2))]"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--chart-2))]"></span>
            </span>
            <span className="text-muted-foreground text-xs">Live · {lastUpdated || "–"}</span>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(statusLabel).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor[key] }} />
                <span className="text-muted-foreground text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Live congestion overlay across {filteredZones.length} of {zones?.length ?? 20} global tourist destinations — click markers for details
      </p>

      {/* Filter Panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground mb-3 hover:text-primary transition-colors group">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-lg bg-muted/30 border border-border/40 mb-4">
            {/* Status Filter */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status</p>
              <div className="flex flex-col gap-2">
                {Object.entries(statusLabel).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <button
                      type="button"
                      onClick={() => setStatusFilter((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        statusFilter[key] ? "border-transparent" : "border-border bg-transparent"
                      }`}
                      style={statusFilter[key] ? { backgroundColor: statusColor[key], borderColor: statusColor[key] } : {}}
                    >
                      {statusFilter[key] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor[key] }} />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    setSelectedCountries(
                      selectedCountries.size === allCountries.length ? new Set() : new Set(allCountries)
                    )
                  }
                >
                  {selectedCountries.size === allCountries.length ? "None" : "All"}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {allCountries.map((country) => (
                  <label key={country} className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        selectedCountries.has(country)
                          ? "bg-primary border-primary"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {selectedCountries.has(country) && (
                        <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm text-foreground">{country}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Eco Score Filter */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Min Eco Score: <span className="text-foreground font-bold">{minEcoScore}</span>
              </p>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[minEcoScore]}
                onValueChange={([val]) => setMinEcoScore(val)}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
              {minEcoScore > 0 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline mt-2"
                  onClick={() => setMinEcoScore(0)}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Map */}
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
