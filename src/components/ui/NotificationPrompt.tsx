"use client";

import { useState, useEffect } from "react";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    setPermission(Notification.permission);

    // Only show prompt if not already granted/denied and user hasn't dismissed
    const dismissed = localStorage.getItem("tavadiena_notif_dismissed");
    if (Notification.permission === "default" && !dismissed) {
      // Delay showing to not annoy on first visit
      const timer = setTimeout(() => setShow(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function requestPermission() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Register for push
        const reg = await navigator.serviceWorker.ready;
        // For now, show a test notification
        reg.showNotification("TavaDiena.lv", {
          body: "Paziņojumi ir ieslēgti! Saņemsi vārda dienu atgādinājumus.",
          icon: "/icons/icon-192.svg",
        });
      }

      setShow(false);
    } catch {
      setShow(false);
    }
  }

  function dismiss() {
    localStorage.setItem("tavadiena_notif_dismissed", "true");
    setShow(false);
  }

  if (!show || permission !== "default") return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40 bg-bg-secondary border border-border rounded-xl shadow-lg p-4 animate-fade-in">
      <div className="flex gap-3">
        <div className="shrink-0 text-2xl">🔔</div>
        <div className="flex-1">
          <p className="font-medium text-text text-sm mb-1">
            Vārda dienu atgādinājumi
          </p>
          <p className="text-xs text-text-muted mb-3">
            Saņem paziņojumu, kad tuviem cilvēkiem ir vārda diena.
          </p>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              Ieslēgt
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text transition-colors"
            >
              Vēlāk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
