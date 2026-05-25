"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const center: [number, number] = [30.3900, 78.108889];

const customIcon = L.divIcon({
  className: "custom-luxury-pin",
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(197, 168, 128, 0.4);
        border-radius: 50%;
        animation: pulse 2s infinite ease-in-out;
      "></div>
      <div style="
        width: 12px;
        height: 12px;
        background-color: #C5A880;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 2;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapResizer({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();

  useEffect(() => {
    const timeout0 = setTimeout(() => map.invalidateSize(), 0);
    const timeout250 = setTimeout(() => map.invalidateSize(), 250);
    const timeout600 = setTimeout(() => map.invalidateSize(), 600);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeout0);
      clearTimeout(timeout250);
      clearTimeout(timeout600);
      resizeObserver.disconnect();
    };
  }, [map, containerRef]);

  return null;
}

export default function LocationMap() {
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div ref={wrapperRef} className="absolute inset-0" style={{ zIndex: 0 }}>
      <style>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          background: #1A251D;
        }
        .luxury-tiles {
          filter: sepia(30%) hue-rotate(85deg) brightness(130%) contrast(110%);
        }
        .custom-tooltip {
          background: rgba(26, 37, 29, 0.9);
          border: 1px solid rgba(197, 168, 128, 0.3);
          color: #C5A880;
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 2px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(26, 37, 29, 0.9) !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .leaflet-control-attribution {
          background: rgba(26, 37, 29, 0.7) !important;
          color: rgba(255, 255, 255, 0.5) !important;
          border-radius: 4px 0 0 0;
        }
        .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.7) !important;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapResizer containerRef={wrapperRef} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker 
          position={center} 
          icon={customIcon}
          eventHandlers={{
            click: () => window.open('https://www.google.com/maps/search/?api=1&query=30.3900,78.108889', '_blank')
          }}
        >
          <Tooltip direction="top" offset={[0, -12]} className="custom-tooltip">
            View on Google Maps
          </Tooltip>
        </Marker>
        <ZoomControl position="bottomright" />
      </MapContainer>

      <button
        onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=30.3900,78.108889', '_blank')}
        className="absolute top-4 right-4 z-[1000] bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-xs text-white tracking-widest uppercase transition-colors hover:bg-white/20 rounded-[2px]"
      >
        OPEN IN GOOGLE MAPS ↗
      </button>
    </div>
  );
}
