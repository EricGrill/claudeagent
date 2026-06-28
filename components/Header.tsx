"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/locations", label: "Bitcoin ATM Locations" },
    { href: "/host", label: "Host Bitcoin ATM" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <>
      {/* Promo Banner */}
      <div className="promo-banner">
        GET $5 FREE BITCOIN USE CODE: Hippo5
        <button className="promo-close" aria-label="Close banner">×</button>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo">
            <div className="logo-icon">H</div>
            <div className="logo-text">
              <span className="logo-title">Hippo</span>
              <span className="logo-subtitle">Bitcoin ATM</span>
            </div>
          </Link>

          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a href="tel:6105083009" className="call-button">
            <span className="call-icon">📞</span>
            Call us: (610) 508-3009
          </a>
        </div>
      </header>
    </>
  );
}
