import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationListener = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  // Initialize Push Notifications for mobile APK
  usePushNotifications(user?.id);

  useEffect(() => {
    if (!user) return;

    // Create a channel for real-time notifications
    // We rely on Supabase RLS at the database level to ensure security.
    // The client only receives rows it has SELECT access to.
    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        const newNotif = payload.new;
        
        // Final sanity check on the client side
        if (newNotif.user_id === user.id || newNotif.user_id === null) {
          showNotification(newNotif.tajuk, {
            body: newNotif.mesej,
            tag: newNotif.id
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showNotification]);

  return null; // This component doesn't render anything
};
