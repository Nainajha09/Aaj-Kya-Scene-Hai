"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/feed", label: "Scene" },
  { href: "/profile", label: "You" },
  { href: "/radar", label: "Radar" },
  { href: "/chats", label: "Chats" },
  { href: "/concierge", label: "AI" },
  { href: "/roast", label: "Roast" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    async function loadUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      setUnreadCount(count ?? 0);
    }

    loadUnread();

    // Keep the badge live — updates the moment a new message arrives
    // or gets marked read, without needing to switch tabs.
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0c0a14] border-t border-white/5 flex z-50">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const showBadge = item.href === "/chats" && unreadCount > 0;
        return (
          <a
            key={item.href}
            href={item.href}
            className={
              active
                ? "relative flex-1 text-center py-3 text-xs font-semibold text-[#cf8a5e]"
                : "relative flex-1 text-center py-3 text-xs font-semibold text-[#aca3bd]"
            }
          >
            {item.label}
            {showBadge && (
              <span className="absolute top-1.5 right-[calc(50%-22px)] min-w-[16px] h-4 px-1 rounded-full bg-[#c97b93] text-[#1a1108] text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
