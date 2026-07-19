/* ==========================================================================
   Supabase client for Mount Waverley Badminton Centre.
   The anon key is public by design — every table is guarded by Row Level
   Security, and the public booking path goes through validated RPCs. No
   customer data (names/emails/phones) is ever readable without staff auth.
   ========================================================================== */
(function () {
  const SUPABASE_URL = "https://pfuqghxjtovyuvfjlwld.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdXFnaHhqdG92eXV2Zmpsd2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNDAzMjIsImV4cCI6MjA5OTkxNjMyMn0.r-2iyNsIwQ_xqC850X2Aiim-VzIr6tM7ROltq8AgcOM";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("[MWBC] supabase-js failed to load — bookings will not sync.");
    return;
  }

  window.MWBC_SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
})();
