import { useState, useEffect, useCallback } from "react";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

export const useGeolocation = () => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async () => {
    try {
      const status = await Geolocation.checkPermissions();
      setPermissions(status);
      return status;
    } catch (err) {
      console.error("Error checking geolocation permissions:", err);
      return null;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const status = await Geolocation.requestPermissions();
      setPermissions(status);
      if (status.location !== 'granted') {
        toast.error("Kebenaran lokasi diperlukan untuk fungsi ini.");
      }
      return status;
    } catch (err) {
      console.error("Error requesting geolocation permissions:", err);
      return null;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await checkPermissions();
      if (status?.location !== 'granted') {
        const reqStatus = await requestPermissions();
        if (reqStatus?.location !== 'granted') {
          throw new Error("Kebenaran lokasi tidak diberikan");
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      return position;
    } catch (err: any) {
      console.error("Error getting current position:", err);
      setError(err.message || "Gagal mendapatkan lokasi");
      toast.error("Gagal mendapatkan lokasi GPS");
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkPermissions, requestPermissions]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    coords,
    error,
    loading,
    permissions,
    getCurrentPosition,
    requestPermissions,
    checkPermissions
  };
};
