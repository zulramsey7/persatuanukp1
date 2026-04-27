import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkInitialPermission = async () => {
      if (isNative) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const status = await LocalNotifications.checkPermissions();
        setPermission(status.display === "granted" ? "granted" : "default");
      } else if ("Notification" in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      }
    };
    checkInitialPermission();
  }, [isNative]);

  const requestPermission = useCallback(async () => {
    try {
      // Jika sudah granted, jangan tanya lagi
      if (permission === "granted") return "granted";

      if (isNative) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const res = await LocalNotifications.requestPermissions();
        const granted = (res as any).display === "granted";
        setPermission(granted ? "granted" : "denied");
        if (granted) {
          toast.success("Notifikasi telah diaktifkan!");
          return "granted";
        }
        return "denied";
      }

      if (!("Notification" in window)) {
        return "denied";
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Notifikasi telah diaktifkan!");
      }
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "default";
    }
  }, [isNative, permission]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (isNative) {
      import("@capacitor/local-notifications")
        .then(({ LocalNotifications }) =>
          LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title,
                body: options?.body ?? "",
              },
            ],
          })
        )
        .catch((e) => console.error("Local notification failed:", e));
      return null;
    }

    if (permission === "granted" && "Notification" in window) {
      const notification = new Notification(title, {
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        vibrate: [200, 100, 200],
        ...options,
      } as any);

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };
      return notification;
    }
    return null;
  }, [permission, isNative]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
};
