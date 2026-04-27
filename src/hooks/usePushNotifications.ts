import { useEffect, useCallback } from "react";
import { PushNotifications, Token, ActionPerformed } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePushNotifications = (userId: string | undefined) => {
  const registerPush = useCallback(async () => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    try {
      // 1. Request permissions
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return;
      }

      // 2. Register with FCM
      await PushNotifications.register();

      // 3. Handle registration success (get token)
      PushNotifications.addListener('registration', async (token: Token) => {
        const fcmToken = token.value;
        
        // Update Supabase profiles with the FCM token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('profiles')
          .update({ fcm_token: fcmToken } as Record<string, unknown>)
          .eq('id', userId);

        if (error) {
          toast.error('Gagal menyimpan token notifikasi');
          // eslint-disable-next-line no-console
          console.error('Error saving FCM token to Supabase:', error);
        }
      });

      // 4. Handle registration error
      PushNotifications.addListener('registrationError', (err: unknown) => {
        toast.error('Push registration failed');
        // eslint-disable-next-line no-console
        console.error('Push registration error:', err);
      });

      // 5. Handle received notification while app is open
      PushNotifications.addListener('pushNotificationReceived', (_notification) => {
        // Notification handled by system, can add custom logic here if needed
      });

      // 6. Handle notification action (when user clicks it)
      PushNotifications.addListener('pushNotificationActionPerformed', (_notification: ActionPerformed) => {
        // Could navigate to specific page based on notification data
      });

    } catch (err) {
      toast.error('Push notification setup failed');
      // eslint-disable-next-line no-console
      console.error('Push notification setup failed:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      registerPush();
    }
  }, [userId, registerPush]);

  return { registerPush };
};
