/**
 * Supabase Edge Function: send-push-notification
 * 
 * This function is triggered by a Webhook when a new record is inserted 
 * into the 'notifications' table. It sends a push notification to 
 * all users (if global) or a specific user using Firebase Cloud Messaging.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID"; // Replace this
const FIREBASE_CLIENT_EMAIL = "YOUR_FIREBASE_CLIENT_EMAIL"; // Replace this
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper to get Firebase Access Token
async function getAccessToken() {
  // This is a simplified version; in production use a library like 'google-auth-library'
  // Or use the Firebase Admin SDK equivalent in Edge Functions
  return "YOUR_ACCESS_TOKEN_HERE"; 
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record } = payload; // The new notification record

    console.log("Processing notification:", record.tajuk);

    // 1. Get recipients with fcm_tokens
    let query = supabase.from("profiles").select("fcm_token").not("fcm_token", "is", null);
    
    if (record.user_id) {
      query = query.eq("id", record.user_id);
    }

    const { data: profiles, error: profileError } = await query;
    if (profileError) throw profileError;

    const tokens = (profiles as any[])?.map((p: any) => p.fcm_token).filter(Boolean) || [];
    
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens found" }), { status: 200 });
    }

    // 2. Send to Firebase (Batch or single)
    // Note: Use Firebase v1 HTTP API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
    
    for (const token of tokens) {
      const message = {
        message: {
          token: token,
          notification: {
            title: record.tajuk,
            body: record.mesej,
          },
          android: {
            notification: {
              icon: "stock_ticker_update",
              color: "#7e22ce",
            }
          }
        }
      };

      // Call FCM API
      // await fetch(fcmUrl, { ... });
    }

    return new Response(JSON.stringify({ success: true, count: tokens.length }), { status: 200 });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
