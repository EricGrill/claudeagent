"use client";

import { useCallback } from "react";

const atmImages = [
  { id: 1, alt: "Bitcoin ATM in convenience store" },
  { id: 2, alt: "Bitcoin ATM kiosk" },
  { id: 3, alt: "Bitcoin ATM display" },
  { id: 4, alt: "Zeeks Bitcoin ATM location" },
  { id: 5, alt: "Bitcoin ATM in retail store" },
  { id: 6, alt: "Bitcoin ATM machine" },
];

const locations = [
  {
    id: 1,
    name: "Allentown - Zeeks Convenience",
    address: "1245 Hamilton St, Allentown, PA 18102",
    hours: "Open 24/7",
  },
  {
    id: 2,
    name: "Bethlehem - Quick Stop",
    address: "523 Main St, Bethlehem, PA 18018",
    hours: "6AM - 11PM",
  },
  {
    id: 3,
    name: "Reading - Corner Market",
    address: "890 Penn Ave, Reading, PA 19601",
    hours: "Open 24/7",
  },
  {
    id: 4,
    name: "Lancaster - City Mart",
    address: "156 Duke St, Lancaster, PA 17602",
    hours: "7AM - 10PM",
  },
  {
    id: 5,
    name: "Easton - Downtown Deli",
    address: "78 Northampton St, Easton, PA 18042",
    hours: "Open 24/7",
  },
  {
    id: 6,
    name: "Berks County - Express Shop",
    address: "234 Market St, Leesport, PA 19533",
    hours: "6AM - 12AM",
  },
];

export default function LocationsPage() {
  const scrollToLocations = useCallback(() => {
    const mapSection = document.getElementById("atm-locations-map");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <main className="locations-page">
      {/* Hero Section */}
      <section className="locations-hero">
        <div className="locations-hero-content">
          {/* ATM Image Gallery */}
          <div className="atm-gallery">
            {atmImages.map((image) => (
              <div key={image.id} className="atm-image-container">
                <div className="atm-image-placeholder">
                  <span>ATM {image.id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Hero Text Content */}
          <div className="locations-hero-text">
            <h1>Bitcoin ATM Locations</h1>
            <p className="hero-subtitle">
              By Hippo Kiosk #1 provider of Bitcoin ATMs in Pennsylvania
            </p>
            <p className="hero-description">
              Bitcoin ATMs are available at Lehigh Valley, Berks, Lancaster, Reading, and nearby 
              counties. Use our Bitcoin ATM map below and locate a bitcoin ATM near you. If you 
              need help locating the Bitcoin ATM near you contact us: (610) 508-3009
            </p>
            <button
              type="button"
              className="cta-button"
              onClick={scrollToLocations}
              aria-label="Scroll to Bitcoin ATM locations map"
            >
              Bitcoin ATM Locations
            </button>
          </div>
        </div>
      </section>

      {/* Locations Map Section */}
      <section id="atm-locations-map" className="locations-map-section">
        <h2>Find a Bitcoin ATM Near You</h2>
        
        {/* Map Placeholder */}
        <div className="map-container">
          <div className="map-placeholder">
            <p>🗺️ Interactive Map</p>
            <p>Bitcoin ATM locations in Pennsylvania</p>
          </div>
        </div>

        {/* Locations List */}
        <div className="locations-list">
          <h3>All Locations</h3>
          <div className="locations-grid">
            {locations.map((location) => (
              <div key={location.id} className="location-card">
                <h4>{location.name}</h4>
                <p className="location-address">{location.address}</p>
                <p className="location-hours">{location.hours}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  Get Directions →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
