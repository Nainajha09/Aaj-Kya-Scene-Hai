"use client";

import { Suspense, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStepIndexForPath, TOUR_STEPS } from "@/lib/tourSteps";

const ITEMS = [
  { href: "/profile", label: "You" },
  { href: "/feed", label: "Scene" },
  { href: "/radar", label: "Radar" },
  { href: "/chats", label: "Chats" },
  { href: "/concierge", label: "AI" },
  { href: "/roast", label: "Roast" },
];

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);

  const tourActive = searchParams.get("tour") !== null;
  const stepIndex = getStepIndexForPath(pathname);
  const highlightedLabel = tourActive && stepIndex !== -1 ? TOUR_STEPS[stepIndex].label : null;

  useEffect(() => {
    const supabase = createClient();

    async function loadUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      setUnreadCount(count ?? 0);
    }

    loadUnread();

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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#100e1c] border-t border-[#b298e7]/15 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] flex z-50 px-1.5 py-1.5 gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const showBadge = item.href === "/chats" && unreadCount > 0;
        const isHighlighted = highlightedLabel === item.label;
        return (
          <a
            key={item.href}
            href={item.href}
            className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-xl"
          >
            <span
              className={
                active
                  ? "px-3 py-1.5 rounded-full bg-[#b298e7]/20 text-[#b298e7] text-xs font-bold"
                  : isHighlighted
                  ? "px-3 py-1.5 rounded-full animate-pulse bg-[#b298e7]/20 ring-2 ring-[#b298e7] text-[#b298e7] text-xs font-bold"
                  : "px-3 py-1.5 rounded-full text-[#b6abd9] text-xs font-semibold"
              }
            >
              {item.label}
            </span>
            {active && (
              <span className="w-1 h-1 rounded-full bg-[#b298e7] mt-0.5" />
            )}
            {showBadge && (
              <span className="absolute top-0 right-[calc(50%-26px)] min-w-[16px] h-4 px-1 rounded-full bg-[#ef7fa8] text-[#1e1830] text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
