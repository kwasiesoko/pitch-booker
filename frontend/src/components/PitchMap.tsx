"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

// Fix default marker icon issue with Leaflet + bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
}

// Map known locations in Accra to coordinates
const LOCATION_COORDS: Record<string, [number, number]> = {
  "east legon": [5.6350, -0.1520],
  "teshie": [5.5750, -0.1050],
  "osu": [5.5550, -0.1700],
  "labone": [5.5600, -0.1750],
  "madina": [5.6700, -0.1680],
  "tema": [5.6698, -0.0166],
  "spintex": [5.6350, -0.0850],
  "dansoman": [5.5500, -0.2650],
  "cantonments": [5.5630, -0.1770],
  "airport": [5.5900, -0.1700],
  "achimota": [5.6150, -0.2350],
  "lapaz": [5.6050, -0.2450],
  "circle": [5.5700, -0.2200],
  "accra": [5.6037, -0.1870],
  "kasoa": [5.5340, -0.4170],
  "dome": [5.6500, -0.2300],
  "adenta": [5.7110, -0.1530],
};

/** Produces a stable small offset from a string so co-located pins fan out. */
function hashOffset(str: string, scale = 0.008): [number, number] {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (h1 * 31 + c) & 0xffff;
    h2 = (h2 * 37 + c) & 0xffff;
  }
  // Normalise to [-scale, +scale]
  return [
    ((h1 / 0xffff) - 0.5) * scale,
    ((h2 / 0xffff) - 0.5) * scale,
  ];
}

function getCoords(location: string, pitchId: string): [number, number] {
  const lower = location.toLowerCase();
  let base: [number, number] = [5.6037, -0.1870]; // default: central Accra
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) {
      base = coords;
      break;
    }
  }
  // Apply a tiny deterministic offset per pitch so stacked pins are separated
  const [dlat, dlon] = hashOffset(pitchId);
  return [base[0] + dlat, base[1] + dlon];
}

export default function PitchMap({ pitches }: { pitches: Pitch[] }) {
  return (
    <MapContainer
      center={[5.6037, -0.1870]}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "400px", width: "100%", borderRadius: "1.5rem" }}
      className="z-0 shadow-xl border border-gray-200 dark:border-white/10"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pitches.map((pitch) => {
      const coords = getCoords(pitch.location, pitch.id);
        return (
          <Marker key={pitch.id} position={coords}>
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-bold text-base mb-1">{pitch.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" />
                  {pitch.location}
                </p>
                <p className="text-sm font-bold text-emerald-600 mb-3">GHS {pitch.pricePerHour}/hr</p>
                <Link
                  href={`/pitches/${pitch.id}`}
                  className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Book Now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
