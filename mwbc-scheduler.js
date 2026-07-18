/* ==========================================================================
   Mount Waverley Badminton Centre — court scheduling engine
   --------------------------------------------------------------------------
   A single source of truth for HOW bookings are placed across the 14 courts,
   used by both the public booking flow (app.js) and the staff console (admin.js).

   Goal: minimise "dead" gaps — free stretches shorter than the 1-hour minimum
   booking, which can never be sold and are pure lost inventory. A booking is
   therefore assigned to the court where it packs most tightly (best-fit),
   with extra weight during peak hours (evenings + weekends), where the schedule
   should stay completely gap-free.

   Two exports do the work:
     • allocate()  — pick the best-fit court(s) for a date/time/duration.
     • evaluate()  — judge a candidate start time as "clean" (no gap created)
                     or gap-leaving, so the UI can steer customers toward the
                     tidy times. Steering strength fades as the date nears
                     (far out → protect the schedule; close in → just fill it).
   ========================================================================== */
(() => {
  const SLOT = 30;                 // scheduling granularity (minutes)
  const MIN_BOOKING = 60;          // shortest sellable block → gaps below this are "dead"
  const CLOSE_MIN = 23 * 60;       // centre closes 11pm
  const COURT_TOTAL = 14;
  const COURTS = Array.from({ length: COURT_TOTAL }, (_, i) => `Court ${i + 1}`);

  const toMin = (time) => {
    const [h, m] = String(time).split(":").map(Number);
    return h * 60 + m;
  };
  const isWeekend = (dateISO) => {
    const d = new Date(`${dateISO}T12:00:00`).getDay();
    return d === 0 || d === 6;
  };
  const openingMin = (dateISO) => (isWeekend(dateISO) ? 8 : 9) * 60;
  // Peak = weekday evenings (5pm onward) and all weekend — mirrors peak pricing.
  const isPeakAt = (dateISO, minutes) => isWeekend(dateISO) || minutes >= 17 * 60;

  const bookingCourts = (b) =>
    Array.isArray(b.courts) ? b.courts : (b.court ? [b.court] : []);

  // Busy intervals [start, end) for one court on one date, sorted by start.
  function busyForCourt(bookings, dateISO, court) {
    return bookings
      .filter((b) => b.date === dateISO && bookingCourts(b).includes(court))
      .map((b) => { const s = toMin(b.time); return [s, s + Number(b.duration)]; })
      .sort((a, b) => a[0] - b[0]);
  }

  // The maximal free interval containing [tStart, tEnd) on a court,
  // or null if the booking would fall out of hours or overlap an existing one.
  function freeSlotAround(busy, openMin, tStart, tEnd) {
    if (tStart < openMin || tEnd > CLOSE_MIN) return null;
    let fStart = openMin;
    let fEnd = CLOSE_MIN;
    for (const [s, e] of busy) {
      if (tStart < e && s < tEnd) return null;      // overlaps a booking
      if (e <= tStart) fStart = Math.max(fStart, e); // nearest booking on the left
      if (s >= tEnd) fEnd = Math.min(fEnd, s);       // nearest booking on the right
    }
    return { fStart, fEnd };
  }

  // Cost of a leftover free stretch: 0 if it butts flush, huge if it's a dead
  // sub-hour orphan, small if it stays sellable.
  const remainderPenalty = (r) => (r === 0 ? 0 : r < MIN_BOOKING ? 1000 : 6);

  function placementCost(free, tStart, tEnd, courtIsEmpty, peak) {
    const left = tStart - free.fStart;
    const right = free.fEnd - tEnd;
    let cost = (remainderPenalty(left) + remainderPenalty(right)) * (peak ? 2 : 1);
    cost += (left > 0 ? 1 : 0) + (right > 0 ? 1 : 0);  // prefer flush placements
    if (courtIsEmpty) cost += 3;                       // keep whole courts free for big bookings
    return cost;
  }

  // Rank every court that can host [time, time+duration) — best-fit first.
  function rankCourts(bookings, dateISO, time, duration) {
    const tStart = toMin(time);
    const tEnd = tStart + Number(duration);
    const openMin = openingMin(dateISO);
    const peak = isPeakAt(dateISO, tStart) || isPeakAt(dateISO, tEnd - SLOT);
    const scored = [];
    COURTS.forEach((court, idx) => {
      const busy = busyForCourt(bookings, dateISO, court);
      const free = freeSlotAround(busy, openMin, tStart, tEnd);
      if (!free) return;
      scored.push({ court, idx, cost: placementCost(free, tStart, tEnd, busy.length === 0, peak) });
    });
    scored.sort((a, b) => a.cost - b.cost || a.idx - b.idx);
    return scored;
  }

  // Best-fit court name(s) for a booking. Returns up to `count`; fewer if the
  // centre can't fit that many at once.
  function allocate(bookings, dateISO, time, duration, count = 1) {
    return rankCourts(bookings, dateISO, time, duration).slice(0, count).map((s) => s.court);
  }

  // Judge a candidate start time: is it available, and does the best-fit
  // placement leave any dead sub-hour gap?
  function evaluate(bookings, dateISO, time, duration, count = 1) {
    const ranked = rankCourts(bookings, dateISO, time, duration);
    const available = ranked.length >= count;
    const chosen = ranked.slice(0, count);
    const tStart = toMin(time);
    const tEnd = tStart + Number(duration);
    const openMin = openingMin(dateISO);
    let dead = 0;
    chosen.forEach(({ court }) => {
      const busy = busyForCourt(bookings, dateISO, court);
      const free = freeSlotAround(busy, openMin, tStart, tEnd);
      if (!free) return;
      const left = tStart - free.fStart;
      const right = free.fEnd - tEnd;
      if ((left > 0 && left < MIN_BOOKING) || (right > 0 && right < MIN_BOOKING)) dead += 1;
    });
    return {
      available,
      clean: available && dead === 0,
      peak: isPeakAt(dateISO, tStart),
      courts: chosen.map((s) => s.court)
    };
  }

  // Steering strength by lead time: ~1 when the date is a week or more out
  // (protect the schedule), fading to 0 as it approaches (fill the courts).
  function steerWeight(dateISO, todayISO) {
    const lead = Math.round(
      (Date.parse(`${dateISO}T00:00:00`) - Date.parse(`${todayISO}T00:00:00`)) / 86400000
    );
    return Math.max(0, Math.min(1, (lead - 1) / 6));
  }

  window.MWBC_SCHEDULER = {
    COURTS,
    allocate,
    rankCourts,
    evaluate,
    steerWeight,
    isPeakAt,
    isWeekend
  };
})();
