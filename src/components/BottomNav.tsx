"use client";

import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/profile", label: "You" },
  { href: "/radar", label: "Radar" },
  { href: "/chats", label: "Chats" },
  { href: "/concierge", label: "AI" },
  { href: "/roast", label: "Roast" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c0a14] border-t border-white/5 flex z-50">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex-1 text-center py-3 text-xs font-semibold text-[#cf8a5e]"
                : "flex-1 text-center py-3 text-xs font-semibold text-[#aca3bd]"
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
