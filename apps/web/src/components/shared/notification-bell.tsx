"use client";

import { useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  type: string;
  message: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex items-center text-stone-500 hover:text-stone-300 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-none stroke-current stroke-2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-amber-500 font-mono text-[9px] text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-80 border border-stone-700 bg-stone-950 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
            <span className="font-display text-xs uppercase tracking-widest text-stone-300">
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="font-mono text-xs text-stone-600 hover:text-amber-500 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {loading ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-stone-600">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-stone-600">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-stone-900 last:border-0 ${n.read ? "" : "bg-stone-900/60"}`}
                  >
                    {n.linkUrl ? (
                      <a
                        href={n.linkUrl}
                        className="block px-4 py-3 hover:bg-stone-900 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <p className="text-xs text-stone-300">{n.message}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-stone-600">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </a>
                    ) : (
                      <div className="px-4 py-3">
                        <p className="text-xs text-stone-300">{n.message}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-stone-600">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
