"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "今日のタスク" },
  { href: "/characters", label: "キャラクター" },
  { href: "/content", label: "コンテンツ" },
  { href: "/calendar", label: "投稿カレンダー" },
  { href: "/fanvue", label: "Fanvue" },
  { href: "/ugc", label: "UGC案件" },
  { href: "/analytics", label: "分析" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        background: "var(--color-ink)",
        color: "white",
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 20,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-coral), var(--color-turquoise))",
            display: "inline-block",
          }}
        />
        Maria HQ
      </div>
      <div style={{ fontSize: 12, color: "#9d9daa", marginBottom: 24 }}>AI Influencer Ops</div>

      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              color: active ? "white" : "#b5b5c2",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: active ? "3px solid var(--color-coral)" : "3px solid transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
