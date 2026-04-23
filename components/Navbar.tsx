"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Translate" },
  { href: "/reverse", label: "Decode" },
  { href: "/history", label: "Saved" },
];

export function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:50,
      background:"rgba(14,15,12,0.9)", backdropFilter:"blur(12px)",
      borderBottom:"1px solid var(--border)",
      padding:"0 1.5rem", height:"52px",
      display:"flex", alignItems:"center", justifyContent:"space-between"
    }}>
      <Link href="/" style={{
        fontFamily:"var(--display)", fontSize:"1.25rem", fontWeight:400,
        color:"var(--amber)", letterSpacing:"-0.02em", textDecoration:"none"
      }}>
        Cronly
      </Link>
      <div style={{ display:"flex", gap:"4px" }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding:"5px 12px", borderRadius:"6px", fontSize:"13px",
            fontFamily:"var(--sans)", textDecoration:"none", transition:"all 0.15s",
            background: path === l.href ? "var(--bg4)" : "transparent",
            color: path === l.href ? "var(--text)" : "var(--text2)",
            border: path === l.href ? "1px solid var(--border2)" : "1px solid transparent",
          }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
