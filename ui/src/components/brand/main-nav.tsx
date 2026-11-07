"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Scans" },
  { href: "/styleguide", label: "Style guide" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-sm px-2.5 py-1.5 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function MainNav() {
  const path = usePathname();
  return (
    <>
      {NAV.map((n) => (
        <NavLink key={n.href} {...n} active={n.href === "/" ? path === "/" || path.startsWith("/scan/SCN") : path.startsWith(n.href)} />
      ))}
    </>
  );
}

/** Static fallback while the pathname streams in. */
export function MainNavFallback() {
  return (
    <>
      {NAV.map((n) => (
        <NavLink key={n.href} {...n} active={false} />
      ))}
    </>
  );
}
