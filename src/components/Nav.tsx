"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "../lib/constants";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1 z-50">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white">AI Harm Landscape</h1>
        <p className="text-xs text-gray-400 mt-1">Visual Analytics</p>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-gray-800 text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-gray-800">
        <p className="text-[10px] text-gray-500 leading-tight">
          CSEN 377 · Data Visualization<br />
          Santa Clara University · 2026
        </p>
      </div>
    </nav>
  );
}
