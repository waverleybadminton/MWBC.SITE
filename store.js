/* ==========================================================================
   MWBC booking store — the single shared source of truth for bookings.
   --------------------------------------------------------------------------
   Bookings live in Supabase (shared across every device, with the database
   itself preventing double-bookings). This module keeps a synchronous
   in-memory cache so the existing render code in app.js / admin.js can keep
   calling `all()` without becoming async, and re-renders on change events.

   Two visibility modes:
     • Public (anon):  cache holds busy time-ranges only — NO customer PII.
     • Staff (authed): cache holds full booking rows, grouped per booking.

   Events dispatched on window:
     • "mwbc-bookings-updated" — cache changed, re-render.
     • "mwbc-auth-changed"     — staff signed in/out (detail.authed).
   ========================================================================== */
(function () {
  const pad = (n) => String(n).padStart(2, "0");
  const minToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const timeToMin = (t) => {
    const [h, mn] = String(t).split(":").map(Number);
    return h * 60 + mn;
  };
  const courtNum = (c) => Number(String(c).match(/\d+/)?.[0] || 0);
  const courtName = (n) => `Court ${n}`;
  const STATUS = { paid: "Paid", unpaid: "Unpaid", hold: "Hold", cancelled: "Cancelled" };
  const SOURCE = { online: "Online", phone: "Phone", school: "School" };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const sb = () => window.MWBC_SB;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  // Turn full DB rows into the booking shape the UI already expects.
  function groupRows(rows) {
    const map = new Map();
    rows.forEach((r) => {
      let g = map.get(r.group_id);
      if (!g) {
        g = {
          id: r.group_id,
          name: r.customer_name || "",
          email: r.email || "",
          phone: r.phone || "",
          status: STATUS[r.status] || "Unpaid",
          source: SOURCE[r.source] || "Online",
          date: r.booking_date,
          time: minToTime(r.start_min),
          duration: r.end_min - r.start_min,
          courts: [],
          courtCount: 0,
          price: 0,
          notes: r.notes || "",
          stripeSessionId: r.stripe_session_id || null,
          schoolId: r.school_id || null,
          createdAt: r.created_at
        };
        map.set(r.group_id, g);
      }
      g.courts.push(courtName(r.court));
      g.price += (r.price_cents || 0) / 100;
    });
    const list = [...map.values()];
    list.forEach((g) => {
      g.courts.sort((a, b) => courtNum(a) - courtNum(b));
      g.court = g.courts[0];
      g.courtCount = g.courts.length;
    });
    list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return list;
  }

  // Busy ranges → lightweight pseudo-bookings for availability math (no PII).
  function pseudoFromAvailability(rows) {
    return rows.map((r) => ({
      date: r.booking_date,
      time: minToTime(r.start_min),
      duration: r.end_min - r.start_min,
      court: courtName(r.court),
      courts: [courtName(r.court)],
      status: "",
      source: ""
    }));
  }

  const store = {
    _cache: [],
    _authed: false,
    _channel: null,
    ready: false,

    all() {
      return this._cache;
    },
    isAuthed() {
      return this._authed;
    },

    async init() {
      const client = sb();
      if (!client) return;
      try {
        const {
          data: { session }
        } = await client.auth.getSession();
        this._authed = session ? await this._checkStaff() : false;
      } catch {
        this._authed = false;
      }
      await this._refresh();
      this._resubscribe();
      client.auth.onAuthStateChange(async (_event, session) => {
        this._authed = session ? await this._checkStaff() : false;
        await this._refresh();
        this._resubscribe();
        emit("mwbc-auth-changed", { authed: this._authed });
      });
      this.ready = true;
    },

    // Is the signed-in user actually on the staff allow-list? (RLS returns
    // their own row only if so.)
    async _checkStaff() {
      const { data, error } = await sb().from("staff").select("user_id").limit(1);
      return !error && Array.isArray(data) && data.length > 0;
    },

    async _refresh() {
      const client = sb();
      if (!client) return;
      if (this._authed) {
        const { data, error } = await client.from("bookings").select("*");
        this._cache = error ? [] : groupRows(data || []);
      } else {
        const { data, error } = await client.rpc("availability", {});
        this._cache = error ? [] : pseudoFromAvailability(data || []);
      }
      emit("mwbc-bookings-updated");
    },

    _resubscribe() {
      const client = sb();
      if (!client) return;
      if (this._channel) {
        client.removeChannel(this._channel);
        this._channel = null;
      }
      // Realtime only delivers rows RLS allows — i.e. only for staff.
      if (this._authed) {
        this._channel = client
          .channel("mwbc-bookings-rt")
          .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () =>
            this._refresh()
          )
          .subscribe();
      }
    },

    // Public booking → validated server-side RPC (respects the no-overlap
    // constraint). Throws { message: "slot_unavailable" } if the slot is taken.
    async createPublic(b) {
      const start = timeToMin(b.time);
      const { data, error } = await sb().rpc("request_booking", {
        p_date: b.date,
        p_start_min: start,
        p_end_min: start + Number(b.duration),
        p_courts: b.courts.map(courtNum),
        p_name: b.name || "",
        p_email: b.email || "",
        p_phone: b.phone || "",
        p_price_cents_per_court: Math.round(b.pricePerCourtCents || 0),
        p_source: "online"
      });
      if (error) throw error;
      await this._refresh();
      return data; // group_id
    },

    // Staff booking → direct insert (authenticated), with a chosen status.
    async createManual(b) {
      const start = timeToMin(b.time);
      const end = start + Number(b.duration);
      const gid = uuid();
      const rows = b.courts.map((c) => ({
        group_id: gid,
        court: courtNum(c),
        booking_date: b.date,
        start_min: start,
        end_min: end,
        customer_name: b.name || null,
        email: b.email || null,
        phone: b.phone || null,
        status: (b.status || "Unpaid").toLowerCase(),
        source: "phone",
        price_cents: Math.round(b.pricePerCourtCents || 0),
        notes: b.notes || null
      }));
      const { error } = await sb().from("bookings").insert(rows);
      if (error) throw error;
      await this._refresh();
      return gid;
    },

    // Edit a booking group atomically (staff). Throws on overlap.
    async updateBooking(groupId, b) {
      const start = timeToMin(b.time);
      const { error } = await sb().rpc("replace_booking", {
        p_group: groupId,
        p_courts: b.courts.map(courtNum),
        p_date: b.date,
        p_start_min: start,
        p_end_min: start + Number(b.duration),
        p_name: b.name || "",
        p_email: b.email || "",
        p_phone: b.phone || "",
        p_status: (b.status || "Unpaid").toLowerCase(),
        p_source: (b.source || "phone").toLowerCase(),
        p_price_cents: Math.round(b.pricePerCourtCents || 0),
        p_notes: b.notes || "",
        p_session_id: b.stripeSessionId || ""
      });
      if (error) throw error;
      await this._refresh();
    },

    async remove(groupId) {
      const { error } = await sb().from("bookings").delete().eq("group_id", groupId);
      if (error) throw error;
      await this._refresh();
    },

    // Create a school booking (many sessions) in one transaction. Staff only.
    // Each session carries price_cents = per-court price (rate x hours).
    async createSchoolBooking(b) {
      const sessions = (b.sessions || []).map((s) => {
        const start = timeToMin(s.time);
        return {
          date: s.date,
          start_min: start,
          end_min: start + Number(s.duration),
          courts: s.courts.map(courtNum),
          price_cents: Math.round(s.perCourtCents || 0)
        };
      });
      const { data, error } = await sb().rpc("create_school_booking", {
        p_school_name: b.schoolName,
        p_contact_name: b.contactName || "",
        p_contact_email: b.email || "",
        p_contact_phone: b.phone || "",
        p_reference: b.reference || "",
        p_notes: b.notes || "",
        p_quote_cents: Math.round(b.quoteCents || 0),
        p_items: b.items || [],
        p_sessions: sessions
      });
      if (error) throw error;
      await this._refresh();
      return data; // school_bookings id
    },

    async updateSchoolBooking(schoolId, b) {
      const sessions = (b.sessions || []).map((s) => {
        const start = timeToMin(s.time);
        return {
          date: s.date,
          start_min: start,
          end_min: start + Number(s.duration),
          courts: s.courts.map(courtNum),
          price_cents: Math.round(s.perCourtCents || 0)
        };
      });
      const { error } = await sb().rpc("replace_school_booking", {
        p_school_id: schoolId,
        p_school_name: b.schoolName,
        p_contact_name: b.contactName || "",
        p_contact_email: b.email || "",
        p_contact_phone: b.phone || "",
        p_reference: b.reference || "",
        p_notes: b.notes || "",
        p_quote_cents: Math.round(b.quoteCents || 0),
        p_items: b.items || [],
        p_sessions: sessions
      });
      if (error) throw error;
      await this._refresh();
      return schoolId;
    },

    async listSchoolBookings() {
      const { data, error } = await sb().from("school_bookings").select("*").order("created_at", { ascending: false });
      return error ? [] : (data || []);
    },

    async removeSchoolBooking(schoolId) {
      const { error } = await sb().from("school_bookings").delete().eq("id", schoolId);
      if (error) throw error;
      await this._refresh();
    },

    // Refund the customer (payment minus the $5 fee) and free the court. Staff only.
    async refundCancel(groupId) {
      const { data, error } = await sb().functions.invoke("refund-booking", {
        body: { group_id: groupId }
      });
      if (error) throw error;
      if (!data || !data.ok) throw new Error((data && data.error) || "refund_failed");
      await this._refresh();
      return data;
    },

    async clearAll() {
      const { error } = await sb().from("bookings").delete().gte("start_min", 0);
      if (error) throw error;
      await this._refresh();
    },

    // Assign (once) and return a sequential invoice number for a school
    // booking. Idempotent — re-opening returns the same number.
    async assignSchoolInvoiceNo(schoolId) {
      const { data, error } = await sb().rpc("assign_invoice_no_school", { p_school: schoolId });
      if (error) throw error;
      return data;
    },
    async assignGroupInvoiceNo(groupId) {
      const { data, error } = await sb().rpc("assign_invoice_no_group", { p_group: groupId });
      if (error) throw error;
      return data;
    },

    // AI email parser (Claude). Returns the parsed booking, or null if it's
    // unavailable (no API key / error) so the caller can fall back to regex.
    async parseEmail(text) {
      try {
        const { data, error } = await sb().functions.invoke("parse-booking-email", {
          body: { text }
        });
        if (error || !data || !data.ok) return null;
        return data.parsed;
      } catch {
        return null;
      }
    },

    async signIn(email, password) {
      const { error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() {
      await sb().auth.signOut();
    }
  };

  window.MWBC_STORE = store;
  store.init().catch((e) => console.error("[MWBC] store init failed", e));
})();
