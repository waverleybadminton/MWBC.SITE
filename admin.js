(() => {
const courts = Array.from({ length: 14 }, (_, index) => `Court ${index + 1}`);
const closeHour = 23;
const i18n = window.MWBC_I18N;
const t = (key, variables) => i18n?.t(key, variables) || key;
const isChinese = () => i18n?.isChinese() || false;

const bookingCount = document.querySelector("#admin-booking-count");
const revenue = document.querySelector("#admin-revenue");
const utilisation = document.querySelector("#admin-utilisation");
const bookingRows = document.querySelector("#admin-bookings");
const clearButton = document.querySelector("#clear-bookings");
const schedule = document.querySelector("#court-schedule");
const adminDate = document.querySelector("#admin-date");
const dayTabs = document.querySelector("#day-tabs");
const selectedDayLabel = document.querySelector("#selected-day-label");
const selectedDaySubtitle = document.querySelector("#selected-day-subtitle");
const manualForm = document.querySelector("#manual-booking-form");
const manualDate = document.querySelector("#manual-date");
const manualCourt = document.querySelector("#manual-court");
const manualCourtCount = document.querySelector("#manual-court-count");
const manualTime = document.querySelector("#manual-time");
const manualDuration = document.querySelector("#manual-duration");
const manualStatus = document.querySelector("#manual-status");
const manualNote = document.querySelector("#manual-note");
const manualBookingTitle = document.querySelector("#manual-booking-title");
const loginScreen = document.querySelector("#admin-login");
const loginForm = document.querySelector("#admin-login-form");
const loginNote = document.querySelector("#admin-login-note");
const adminDashboard = document.querySelector("#admin-dashboard");
const logoutButton = document.querySelector("#admin-logout");
const newBookingButton = document.querySelector("#new-booking-btn");
const manualModal = document.querySelector("#manual-modal");
const closeManualModalButton = document.querySelector("#close-manual-modal");
const manualModalBackdrop = document.querySelector("#manual-modal-backdrop");
const manualRepeat = document.querySelector("#manual-repeat");
const manualRepeatField = document.querySelector("#manual-repeat-field");
const manualDelete = document.querySelector("#manual-delete");
const manualSubmit = manualForm.querySelector('button[type="submit"]');

// Which booking group is being edited (null = creating a new one).
let editingGroupId = null;
let editingSource = "phone";
let editingSessionId = "";

function courtNumber(court) {
  return Number(String(court).match(/\d+/)?.[0] || 0);
}

// Escape user-supplied text before it goes into innerHTML.
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function isoToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function readBookings() {
  return window.MWBC_STORE ? window.MWBC_STORE.all() : [];
}

function displayDate(value, options = {}) {
  return new Intl.DateTimeFormat(i18n?.locale() || "en-AU", {
    weekday: options.short ? "short" : "long",
    day: "numeric",
    month: options.short ? "numeric" : "short"
  }).format(new Date(`${value}T12:00:00`));
}

function displayTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  if (isChinese()) return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const suffix = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")}${suffix}`;
}

function displayCourt(court) {
  if (!isChinese()) return court;
  const number = String(court).match(/\d+/)?.[0] || court;
  return `${number} 号场`;
}

function minutesFromTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isWeekend(dateValue) {
  const day = new Date(`${dateValue}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function openingHour(dateValue) {
  return isWeekend(dateValue) ? 8 : 9;
}

function hourlyRate(dateValue, minutes) {
  if (isWeekend(dateValue)) return 31;
  return minutes >= 17 * 60 ? 31 : 22;
}

function computePrice(dateValue, time, duration) {
  const start = minutesFromTime(time);
  const durationMinutes = Number(duration);
  let total = 0;
  for (let offset = 0; offset < durationMinutes; offset += 30) {
    const segmentMinutes = Math.min(30, durationMinutes - offset);
    total += hourlyRate(dateValue, start + offset) * (segmentMinutes / 60);
  }
  return Math.round(total);
}

function overlaps(startA, durationA, startB, durationB) {
  return startA < startB + Number(durationB) && startB < startA + Number(durationA);
}

function bookingCourts(booking) {
  if (Array.isArray(booking.courts)) return booking.courts;
  if (booking.court) return [booking.court];
  return [];
}

function selectedDateBookings() {
  return readBookings()
    .filter((booking) => booking.date === adminDate.value)
    .sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time) || (bookingCourts(a)[0] || "").localeCompare(bookingCourts(b)[0] || ""));
}

function getScheduleTimes() {
  const times = [];
  const openHour = openingHour(adminDate.value);
  for (let minutes = openHour * 60; minutes < closeHour * 60; minutes += 30) {
    times.push(timeFromMinutes(minutes));
  }
  return times;
}

// Colour = who booked (blue online / green booked-by-us / purple school); an
// amber bar + tag marks unpaid.
function bookingClass(booking) {
  if (booking.source === "School") return "booking-school";
  const source = booking.source === "Phone" || booking.source === "Manual" ? "booking-phone" : "booking-online";
  const paid = booking.status === "Paid" ? "is-paid" : "is-unpaid";
  return `${source} ${paid}`;
}

function bookingBlockHTML(booking) {
  if (booking.source === "School") {
    return `<span class="bb-name">${escapeHtml(booking.name)}</span><span class="bb-tag">${t("School")}</span>`;
  }
  const phone = booking.phone || booking.email || "";
  const tag = booking.status === "Paid" ? t("Paid") : t("Unpaid");
  return `<span class="bb-name">${escapeHtml(booking.name)}</span>`
    + (phone ? `<span class="bb-phone">${escapeHtml(phone)}</span>` : "")
    + `<span class="bb-tag">${escapeHtml(tag)}</span>`;
}

function isCourtOccupied(bookings, court, time) {
  const start = minutesFromTime(time);
  return bookings.some((booking) => {
    if (!bookingCourts(booking).includes(court)) return false;
    return overlaps(start, 30, minutesFromTime(booking.time), booking.duration);
  });
}

function formatDuration(minutes) {
  if (minutes < 60) return isChinese() ? `${minutes} 分钟` : `${minutes} minutes`;
  const hours = minutes / 60;
  if (isChinese()) return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? "hour" : "hours"}`;
}

/* ---------- booking modal ---------- */

function openModal() {
  manualModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => document.querySelector("#manual-name").focus(), 0);
}

function closeManualModal() {
  manualModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function resetModalFields() {
  editingGroupId = null;
  document.querySelector("#manual-name").value = "";
  document.querySelector("#manual-phone").value = "";
  document.querySelector("#manual-email").value = "";
  document.querySelector("#manual-notes").value = "";
  manualCourtCount.value = "1";
  manualStatus.value = "Unpaid";
  if (manualRepeat) manualRepeat.value = "1";
  if (manualRepeatField) manualRepeatField.hidden = false;
  if (manualDelete) manualDelete.hidden = true;
  if (manualSubmit) manualSubmit.textContent = t("Add Booking");
  manualNote.textContent = "";
}

// Click an existing booking → open the modal pre-filled to edit it.
function openEditModal(booking) {
  if (booking.source === "School") {
    window.alert(t("School bookings are managed in the School bookings list below."));
    return;
  }
  resetModalFields();
  editingGroupId = booking.id;
  editingSource = booking.source === "Online" ? "online" : "phone";
  editingSessionId = booking.stripeSessionId || "";
  document.querySelector("#manual-name").value = booking.name === t("Reserved") ? "" : booking.name;
  document.querySelector("#manual-phone").value = booking.phone || "";
  document.querySelector("#manual-email").value = booking.email || "";
  document.querySelector("#manual-notes").value = booking.notes || "";
  manualCourtCount.value = String(booking.courtCount || bookingCourts(booking).length || 1);
  renderManualOptions();
  manualCourt.value = bookingCourts(booking)[0] || "auto";
  manualDate.value = booking.date;
  manualTime.value = booking.time;
  manualDuration.value = String(booking.duration);
  manualStatus.value = booking.status === "Paid" ? "Paid" : (booking.status === "Hold" ? "Hold" : "Unpaid");
  if (manualRepeatField) manualRepeatField.hidden = true;   // no recurring while editing
  if (manualDelete) manualDelete.hidden = false;
  if (manualSubmit) manualSubmit.textContent = t("Update Booking");
  manualBookingTitle.textContent = t("Edit booking");
  openModal();
}

// Click an empty slot → open a booking pre-filled for that court, time and a
// default one-hour block. This is the primary way staff add a booking.
function quickBookCell(court, time) {
  resetModalFields();
  manualDate.value = adminDate.value;
  manualCourt.value = court;
  manualTime.value = time;
  manualDuration.value = "60";
  const end = timeFromMinutes(minutesFromTime(time) + 60);
  manualBookingTitle.textContent = `${displayCourt(court)} · ${displayTime(time)}-${displayTime(end)}`;
  manualNote.textContent = isChinese()
    ? "可在下方调整时长与场地数量。"
    : "Adjust duration or number of courts below.";
  openModal();
}

// Explicit "New booking" button → blank modal at the first free-looking slot.
function openBlankModal() {
  resetModalFields();
  manualDate.value = adminDate.value;
  manualCourt.value = "auto";
  const times = getScheduleTimes();
  const bookings = selectedDateBookings();
  const firstFree = times.find((time) => !isCourtOccupied(bookings, courts[0], time)) || times[0];
  manualTime.value = firstFree;
  manualDuration.value = "60";
  manualBookingTitle.textContent = t("New booking");
  openModal();
}

async function cancelBooking(id) {
  const booking = readBookings().find((item) => item.id === id);
  if (!booking) return;
  const label = `${booking.name} · ${displayTime(booking.time)}`;
  const isPaid = booking.status === "Paid";
  const prompt = isPaid
    ? t("Refund this customer minus the $5 cancellation fee, and free the court?")
    : t("Cancel this booking and free the court?");
  if (!window.confirm(`${prompt}\n\n${label}`)) return;
  try {
    if (isPaid) {
      const res = await window.MWBC_STORE.refundCancel(id);
      const refunded = ((res && res.refundedCents) || 0) / 100;
      window.alert(`${t("Refund complete.")} $${refunded.toFixed(2)}`);
    } else {
      await window.MWBC_STORE.remove(id);
    }
  } catch {
    window.alert(t("Couldn't cancel that booking. Please try again."));
  }
}

/* ---------- rendering ---------- */

function renderDayTabs() {
  dayTabs.innerHTML = "";
  const today = isoToday();
  const base = adminDate.value || today;
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    const button = document.createElement("button");
    button.type = "button";
    button.className = date === base ? "active" : "";
    button.textContent = i === 0 ? t("Today") : displayDate(date, { short: true });
    button.addEventListener("click", () => {
      adminDate.value = date;
      manualDate.value = date;
      closeManualModal();
      renderAll();
    });
    dayTabs.append(button);
  }
}

// Grid is transposed: courts run across the columns, times down the rows, so
// the time label sits on the same row (sticky at the left) as every court —
// which makes it hard to misread the time even for courts 13/14 on the right.
function renderSchedule() {
  const times = getScheduleTimes();
  const bookings = selectedDateBookings();
  schedule.style.setProperty("--court-count", courts.length);
  schedule.innerHTML = "";

  const corner = document.createElement("div");
  corner.className = "schedule-corner";
  corner.style.gridColumn = "1";
  corner.style.gridRow = "1";
  corner.textContent = t("Time");
  schedule.append(corner);

  courts.forEach((court, courtIndex) => {
    const header = document.createElement("div");
    header.className = "court-header";
    header.textContent = courtNumber(court);
    header.style.gridColumn = `${courtIndex + 2}`;
    header.style.gridRow = "1";
    header.setAttribute("aria-label", displayCourt(court));
    schedule.append(header);
  });

  times.forEach((time, timeIndex) => {
    const label = document.createElement("div");
    label.className = "time-label" + (time.endsWith(":00") ? " hour" : "");
    label.textContent = displayTime(time);
    label.style.gridColumn = "1";
    label.style.gridRow = `${timeIndex + 2}`;
    schedule.append(label);

    courts.forEach((court, courtIndex) => {
      const cell = document.createElement("button");
      const occupied = isCourtOccupied(bookings, court, time);
      cell.type = "button";
      cell.className = "schedule-cell" + (time.endsWith(":00") ? " hour-line" : "");
      cell.dataset.court = court;
      cell.dataset.time = time;
      cell.style.gridColumn = `${courtIndex + 2}`;
      cell.style.gridRow = `${timeIndex + 2}`;
      cell.setAttribute("aria-label", isChinese()
        ? `预订 ${displayCourt(court)} ${displayTime(time)}`
        : `Book ${court} at ${displayTime(time)}`);
      cell.disabled = occupied;
      if (!occupied) cell.addEventListener("click", () => quickBookCell(court, time));
      schedule.append(cell);
    });
  });

  bookings.forEach((booking) => {
    const startIndex = times.indexOf(booking.time);
    if (startIndex < 0) return;
    const slots = Math.max(1, Number(booking.duration) / 30);
    bookingCourts(booking).forEach((court) => {
      const courtIndex = courts.indexOf(court);
      if (courtIndex < 0) return;
      const block = document.createElement("button");
      block.type = "button";
      block.className = `booking-block ${bookingClass(booking)}`;
      block.style.gridColumn = `${courtIndex + 2}`;
      block.style.gridRow = `${startIndex + 2} / span ${slots}`;
      block.title = isChinese()
        ? `${displayCourt(court)}，${displayTime(booking.time)}，${booking.duration} 分钟 — 点击编辑`
        : `${court}, ${displayTime(booking.time)}, ${booking.duration} min — click to edit`;
      block.setAttribute("aria-label", isChinese()
        ? `编辑预订：${booking.name}，${displayCourt(court)}，${displayTime(booking.time)}`
        : `Edit booking: ${booking.name}, ${court} at ${displayTime(booking.time)}`);
      block.innerHTML = bookingBlockHTML(booking);
      block.addEventListener("click", () => openEditModal(booking));
      schedule.append(block);
    });
  });
}

function renderBookings() {
  const bookings = selectedDateBookings();
  const totalMinutes = courts.length * (closeHour - openingHour(adminDate.value)) * 60;
  const bookedMinutes = bookings.reduce((sum, booking) => {
    return sum + Number(booking.duration || 0) * Math.max(1, bookingCourts(booking).length);
  }, 0);
  bookingCount.textContent = bookings.length;
  revenue.textContent = `$${bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0)}`;
  utilisation.textContent = `${Math.round((bookedMinutes / totalMinutes) * 100)}%`;
  selectedDayLabel.textContent = displayDate(adminDate.value);
  selectedDaySubtitle.textContent = isChinese()
    ? `共 14 片场地，${bookings.length} 个预订`
    : `${bookings.length} bookings across 14 courts`;

  bookingRows.innerHTML = "";
  if (!bookings.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="8">${t("No bookings for this day yet. Click any empty slot above to add one.")}</td>`;
    bookingRows.append(row);
    return;
  }

  bookings.forEach((booking) => {
    const row = document.createElement("tr");
    const sourceClass = booking.source === "School" ? "src-school"
      : (booking.source === "Phone" || booking.source === "Manual" ? "src-phone" : "src-online");
    const paidClass = booking.status === "Paid" ? "pill-paid" : "pill-unpaid";
    row.innerHTML = `
      <td>${escapeHtml(booking.name)}</td>
      <td>${escapeHtml(booking.phone || booking.email || "")}</td>
      <td>${isChinese() ? `${displayTime(booking.time)}，${booking.duration} 分钟` : `${displayTime(booking.time)} for ${booking.duration} min`}</td>
      <td>${bookingCourts(booking).map(displayCourt).join(isChinese() ? "、" : ", ")}</td>
      <td><span class="src-pill ${sourceClass}">${t(booking.source || "Online")}</span></td>
      <td>$${booking.price || 0}</td>
      <td><span class="status-pill ${paidClass}">${t(booking.status)}</span></td>
      <td class="table-actions">
        <button class="table-action" type="button" data-edit="${booking.id}">${t("Edit")}</button>
        <button class="table-action danger" type="button" data-cancel="${booking.id}">${booking.status === "Paid" ? t("Refund −$5") : t("Remove")}</button>
      </td>
    `;
    bookingRows.append(row);
  });

  bookingRows.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => cancelBooking(button.dataset.cancel));
  });
  bookingRows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const booking = readBookings().find((b) => b.id === button.dataset.edit);
      if (booking) openEditModal(booking);
    });
  });
}

function renderManualOptions() {
  const selectedCourt = manualCourt.value;
  manualCourt.innerHTML = `<option value="auto">${t("Auto — best available")}</option>` + courts.map((court) => `<option value="${court}">${displayCourt(court)}</option>`).join("");
  if (selectedCourt === "auto" || courts.includes(selectedCourt)) manualCourt.value = selectedCourt;
  const selectedTime = manualTime.value;
  manualTime.innerHTML = getScheduleTimes().map((time) => `<option value="${time}">${displayTime(time)}</option>`).join("");
  if (getScheduleTimes().includes(selectedTime)) manualTime.value = selectedTime;
}

function hasConflict(candidate) {
  const start = minutesFromTime(candidate.time);
  return readBookings().some((booking) => {
    if (booking.date !== candidate.date || !bookingCourts(booking).includes(candidate.court)) return false;
    return overlaps(start, candidate.duration, minutesFromTime(booking.time), booking.duration);
  });
}

function allocateManualCourts(date, time, duration, firstCourt, count, excludeId) {
  // Best-fit allocation via the shared scheduler; ignores the booking being
  // edited so it can keep (or move within) its own slot.
  const pool = excludeId ? readBookings().filter((b) => b.id !== excludeId) : readBookings();
  const ranked = window.MWBC_SCHEDULER
    ? window.MWBC_SCHEDULER.allocate(pool, date, time, duration, courts.length)
    : courts.filter((court) => !pool.some((b) => b.date === date && bookingCourts(b).includes(court)
        && overlaps(minutesFromTime(time), duration, minutesFromTime(b.time), b.duration)));
  if (firstCourt && firstCourt !== "auto") {
    // Staff picked a specific court — honour it, then best-fit the rest.
    return [...ranked.filter((c) => c === firstCourt), ...ranked.filter((c) => c !== firstCourt)].slice(0, count);
  }
  return ranked.slice(0, count);
}

function bindManualBooking() {
  manualForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!manualForm.reportValidity()) return;

    const courtCount = Number(manualCourtCount.value || 1);
    const time = manualTime.value;
    const duration = manualDuration.value;
    const details = {
      name: document.querySelector("#manual-name").value.trim() || t("Reserved"),
      phone: document.querySelector("#manual-phone").value.trim(),
      email: document.querySelector("#manual-email").value.trim(),
      status: manualStatus.value,
      notes: document.querySelector("#manual-notes").value.trim()
    };
    const conflictMsg = isChinese()
      ? "该场地在此时段已被预订，请重新选择。"
      : "That court is already booked at this time. Pick another slot.";
    const noCourtsMsg = (n) => isChinese()
      ? `该时段仅有 ${n} 片场地可用。请选择其他时间或减少场地数量。`
      : `Only ${n} court(s) free at that time. Pick another time or reduce the court count.`;

    if (manualSubmit) manualSubmit.disabled = true;
    manualNote.textContent = t("Saving…");

    try {
      if (editingGroupId) {
        // ---- Edit existing booking ----
        const assigned = allocateManualCourts(manualDate.value, time, duration, manualCourt.value, courtCount, editingGroupId);
        if (assigned.length < courtCount) { manualNote.textContent = noCourtsMsg(assigned.length); return; }
        await window.MWBC_STORE.updateBooking(editingGroupId, {
          ...details,
          courts: assigned,
          date: manualDate.value,
          time,
          duration,
          source: editingSource,
          stripeSessionId: editingSessionId,
          pricePerCourtCents: Math.round(computePrice(manualDate.value, time, duration) * 100)
        });
      } else {
        // ---- Create (optionally repeating weekly) ----
        const weeks = Math.max(1, Number(manualRepeat && manualRepeat.value) || 1);
        let made = 0;
        let skipped = 0;
        for (let i = 0; i < weeks; i++) {
          const date = addDays(manualDate.value, 7 * i);
          const assigned = allocateManualCourts(date, time, duration, manualCourt.value, courtCount);
          if (assigned.length < courtCount) { skipped += 1; continue; }
          try {
            await window.MWBC_STORE.createManual({
              ...details,
              courts: assigned,
              date,
              time,
              duration,
              pricePerCourtCents: Math.round(computePrice(date, time, duration) * 100)
            });
            made += 1;
          } catch { skipped += 1; }
        }
        if (made === 0) { manualNote.textContent = weeks > 1 ? noCourtsMsg(0) : conflictMsg; return; }
        if (weeks > 1 && skipped > 0) {
          window.alert(isChinese()
            ? `已预订 ${made} 周，${skipped} 周因冲突跳过。`
            : `Booked ${made} week(s); ${skipped} skipped due to conflicts.`);
        }
      }

      manualForm.reset();
      resetModalFields();
      manualBookingTitle.textContent = t("New booking");
      manualDate.value = adminDate.value;
      closeManualModal();
    } catch (err) {
      const message = String((err && (err.message || err.msg)) || "");
      manualNote.textContent = /exclusion|overlap|23P01|slot_unavailable/i.test(message)
        ? conflictMsg
        : (isChinese() ? "保存预订失败，请重试。" : "Couldn't save the booking. Please try again.");
    } finally {
      if (manualSubmit) manualSubmit.disabled = false;
    }
  });

  if (manualDelete) {
    manualDelete.addEventListener("click", async () => {
      if (!editingGroupId) return;
      const booking = readBookings().find((b) => b.id === editingGroupId);
      closeManualModal();
      if (booking) await cancelBooking(booking.id);
    });
  }
}

function renderAll() {
  manualDate.value = adminDate.value;
  renderManualOptions();
  renderDayTabs();
  renderSchedule();
  renderBookings();
  renderSchoolList();
}

/* ---------- school bookings ---------- */

const schoolModal = document.querySelector("#school-modal");
const schoolForm = document.querySelector("#school-booking-form");
const sessionRows = document.querySelector("#session-rows");
const schoolQuote = document.querySelector("#school-quote");
const schoolNote = document.querySelector("#school-note");
const schoolBookingsBody = document.querySelector("#school-bookings");
const itemRows = document.querySelector("#item-rows");
const emailModal = document.querySelector("#email-modal");
const emailBody = document.querySelector("#email-body");
const emailGmail = document.querySelector("#email-gmail");
let schoolHeaders = [];

// School court-hire rates (per hour, per court): off-peak $24, peak (5pm+) $34.
const SCHOOL_RATE_OFFPEAK = 24;
const SCHOOL_RATE_PEAK = 34;
function schoolRate(time) {
  return minutesFromTime(time) >= 17 * 60 ? SCHOOL_RATE_PEAK : SCHOOL_RATE_OFFPEAK;
}

function durationOptionsHTML(selected) {
  return [60, 90, 120, 150, 180, 210, 240, 270, 300]
    .map((m) => `<option value="${m}"${m === selected ? " selected" : ""}>${m < 180 ? m + " min" : (m / 60) + " h"}</option>`).join("");
}
function timeOptionsHTML(selected) {
  return getScheduleTimes().map((tm) => `<option value="${tm}"${tm === selected ? " selected" : ""}>${displayTime(tm)}</option>`).join("");
}
function freeCourtCount(date, time, duration) {
  if (!window.MWBC_SCHEDULER) return courts.length;
  return window.MWBC_SCHEDULER.allocate(readBookings(), date, time, duration, courts.length).length;
}

function addSessionRow(date) {
  const row = document.createElement("div");
  row.className = "session-row";
  row.innerHTML = `
    <label>${t("Date")}<input type="date" class="s-date" required></label>
    <label>${t("Start time")}<select class="s-time">${timeOptionsHTML("09:00")}</select></label>
    <label>${t("Duration")}<select class="s-duration">${durationOptionsHTML(120)}</select></label>
    <label>${t("Courts")}<input type="number" class="s-courts" min="1" max="14" value="14"></label>
    <label>${t("$/court/hr")}<input type="number" class="s-rate" min="0" step="1" value="${SCHOOL_RATE_OFFPEAK}"></label>
    <span class="s-avail"></span>
    <button type="button" class="s-remove" aria-label="${t("Remove")}">&times;</button>`;
  const dateInput = row.querySelector(".s-date");
  dateInput.value = date || adminDate.value;
  dateInput.min = isoToday();
  const rateInput = row.querySelector(".s-rate");
  rateInput.value = schoolRate(row.querySelector(".s-time").value);
  // Re-default the rate when the start time changes (unless staff typed one in).
  row.querySelector(".s-time").addEventListener("change", (e) => {
    if (rateInput.dataset.touched !== "1") rateInput.value = schoolRate(e.target.value);
  });
  rateInput.addEventListener("input", () => { rateInput.dataset.touched = "1"; });
  row.querySelectorAll("input, select").forEach((el) => el.addEventListener("change", refreshSchoolCalc));
  row.querySelector(".s-remove").addEventListener("click", () => { row.remove(); refreshSchoolCalc(); });
  sessionRows.append(row);
  refreshSchoolCalc();
}

function readSessions() {
  return Array.from(sessionRows.querySelectorAll(".session-row")).map((row) => ({
    date: row.querySelector(".s-date").value,
    time: row.querySelector(".s-time").value,
    duration: Number(row.querySelector(".s-duration").value),
    courtsWanted: Math.max(1, Math.min(courts.length, Number(row.querySelector(".s-courts").value) || 1)),
    rate: Math.max(0, Number(row.querySelector(".s-rate").value) || 0),
    row
  }));
}

function addItemRow(desc, amount) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <label>${t("Item")}<input type="text" class="i-desc" placeholder="${t("e.g. shuttlecocks, equipment hire")}"></label>
    <label>${t("Amount")}<div class="quote-input"><span>$</span><input type="number" class="i-amount" min="0" step="0.01"></div></label>
    <button type="button" class="s-remove" aria-label="${t("Remove")}">&times;</button>`;
  if (desc) row.querySelector(".i-desc").value = desc;
  if (amount != null) row.querySelector(".i-amount").value = amount;
  row.querySelectorAll("input").forEach((el) => el.addEventListener("input", refreshSchoolCalc));
  row.querySelector(".s-remove").addEventListener("click", () => { row.remove(); refreshSchoolCalc(); });
  itemRows.append(row);
  refreshSchoolCalc();
}

function readItems() {
  return Array.from(itemRows.querySelectorAll(".item-row")).map((row) => ({
    description: row.querySelector(".i-desc").value.trim(),
    amountCents: Math.round((Number(row.querySelector(".i-amount").value) || 0) * 100)
  })).filter((it) => it.description || it.amountCents > 0);
}

// Per-court price for a session = rate x hours.
function sessionPerCourtCents(s) {
  return Math.round(s.rate * (s.duration / 60) * 100);
}

function refreshSchoolCalc() {
  let quoteAuto = 0;
  readSessions().forEach((s) => {
    if (!s.date) return;
    const free = freeCourtCount(s.date, s.time, s.duration);
    const ok = free >= s.courtsWanted;
    const avail = s.row.querySelector(".s-avail");
    avail.textContent = ok
      ? (isChinese() ? `${free} 片空闲` : `${free} free`)
      : (isChinese() ? `仅 ${free} 片空闲` : `only ${free} free`);
    avail.className = "s-avail " + (ok ? "ok" : "short");
    quoteAuto += sessionPerCourtCents(s) / 100 * s.courtsWanted;
  });
  readItems().forEach((it) => { quoteAuto += it.amountCents / 100; });
  if (schoolQuote.dataset.touched !== "1") schoolQuote.value = Math.round(quoteAuto * 100) / 100;
}

function openSchoolModal() {
  schoolForm.reset();
  schoolQuote.dataset.touched = "";
  sessionRows.innerHTML = "";
  itemRows.innerHTML = "";
  schoolNote.textContent = "";
  addSessionRow(adminDate.value);
  schoolModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => document.querySelector("#school-name").focus(), 0);
}
function closeSchoolModal() { schoolModal.hidden = true; document.body.classList.remove("modal-open"); }
function closeEmailModal() { emailModal.hidden = true; document.body.classList.remove("modal-open"); }

function composeSchoolEmail(p, sessions) {
  const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
  const rateStr = (r) => `$${Number(r) % 1 === 0 ? Number(r) : Number(r).toFixed(2)} per hour, per court`;
  const lines = [];
  lines.push(`Dear ${p.contactName || p.schoolName},`, "");
  lines.push("This email confirms your court booking at Mount Waverley Badminton Centre.", "");
  lines.push(`School: ${p.schoolName}`, "");
  lines.push("CONFIRMED SESSIONS");
  sessions.forEach((s) => {
    const end = timeFromMinutes(minutesFromTime(s.time) + Number(s.duration));
    const n = s.courts.length;
    lines.push(`  • ${displayDate(s.date)} — ${displayTime(s.time)} to ${displayTime(end)} — ${n} court${n > 1 ? "s" : ""} — ${rateStr(s.rate)}`);
  });
  lines.push("");
  if (p.items && p.items.length) {
    lines.push("ADDITIONAL ITEMS");
    p.items.forEach((it) => lines.push(`  • ${it.description || "Item"} — ${money(it.amountCents)}`));
    lines.push("");
  }
  lines.push("CANCELLATION POLICY");
  lines.push("  Please note that school and large-group bookings cannot be cancelled or changed once confirmed. To accommodate your group we reserve the courts exclusively and clear all other bookings for these times, so the sessions above are final.", "");
  lines.push("VENUE");
  lines.push("  Mount Waverley Badminton Centre");
  lines.push("  Unit 57, 170 Forster Rd, Mount Waverley VIC 3149");
  lines.push("  0452 242 399 · booking.mwbc@gmail.com", "");
  lines.push(`We look forward to hosting ${p.schoolName}.`, "");
  lines.push("Kind regards,", "Mount Waverley Badminton Centre");
  return lines.join("\n");
}

function showSchoolEmail(p, sessions) {
  const subject = `Booking confirmation — ${p.schoolName} at Mount Waverley Badminton Centre`;
  const body = composeSchoolEmail(p, sessions);
  emailBody.value = body;
  emailGmail.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector("#email-note").textContent = "";
  emailModal.hidden = false;
  document.body.classList.add("modal-open");
}

function emailForSchool(id) {
  const h = schoolHeaders.find((x) => x.id === id);
  if (!h) return;
  const sessions = readBookings().filter((b) => b.schoolId === id)
    .sort((a, b) => a.date.localeCompare(b.date) || minutesFromTime(a.time) - minutesFromTime(b.time))
    .map((b) => {
      const hours = b.duration / 60;
      const perCourt = b.courtCount ? (b.price / b.courtCount) : b.price; // b.price = perCourt x courts
      const rate = hours > 0 ? Math.round((perCourt / hours) * 100) / 100 : 0;
      return { date: b.date, time: b.time, duration: b.duration, courts: b.courts, rate };
    });
  showSchoolEmail({ schoolName: h.school_name, contactName: h.contact_name, email: h.contact_email, phone: h.contact_phone, items: h.items || [] }, sessions);
}

async function removeSchool(id) {
  const h = schoolHeaders.find((x) => x.id === id);
  if (!window.confirm(`${t("Remove this school booking and free all its courts?")}\n\n${h ? h.school_name : ""}`)) return;
  try { await window.MWBC_STORE.removeSchoolBooking(id); await renderSchoolList(); }
  catch { window.alert(t("Couldn't remove. Please try again.")); }
}

async function renderSchoolList() {
  if (!schoolBookingsBody || !window.MWBC_STORE || !window.MWBC_STORE.isAuthed()) return;
  schoolHeaders = await window.MWBC_STORE.listSchoolBookings();
  schoolBookingsBody.innerHTML = "";
  if (!schoolHeaders.length) {
    schoolBookingsBody.innerHTML = `<tr><td colspan="5">${t("No school bookings yet.")}</td></tr>`;
    return;
  }
  const all = readBookings();
  schoolHeaders.forEach((h) => {
    const rows = all.filter((b) => b.schoolId === h.id);
    const dates = [...new Set(rows.map((b) => b.date))].sort();
    const dateSummary = dates.length ? `${displayDate(dates[0], { short: true })}${dates.length > 1 ? ` +${dates.length - 1}` : ""}` : "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(h.school_name)}</td>
      <td>${escapeHtml(h.contact_email || h.contact_phone || h.contact_name || "")}</td>
      <td>${rows.length} · ${escapeHtml(dateSummary)}</td>
      <td>$${(Number(h.quote_cents || 0) / 100).toFixed(2)}</td>
      <td class="table-actions">
        <button class="table-action" type="button" data-school-email="${h.id}">${t("Email")}</button>
        <button class="table-action danger" type="button" data-school-remove="${h.id}">${t("Remove")}</button>
      </td>`;
    schoolBookingsBody.append(tr);
  });
  schoolBookingsBody.querySelectorAll("[data-school-email]").forEach((b) => b.addEventListener("click", () => emailForSchool(b.dataset.schoolEmail)));
  schoolBookingsBody.querySelectorAll("[data-school-remove]").forEach((b) => b.addEventListener("click", () => removeSchool(b.dataset.schoolRemove)));
}

function bindSchoolBookings() {
  if (!schoolForm) return;
  document.querySelector("#new-school-btn").addEventListener("click", openSchoolModal);
  document.querySelector("#add-session-btn").addEventListener("click", () => addSessionRow());
  document.querySelector("#add-item-btn").addEventListener("click", () => addItemRow());
  document.querySelector("#close-school-modal").addEventListener("click", closeSchoolModal);
  document.querySelector("#school-modal-backdrop").addEventListener("click", closeSchoolModal);
  document.querySelector("#close-email-modal").addEventListener("click", closeEmailModal);
  document.querySelector("#email-modal-backdrop").addEventListener("click", closeEmailModal);
  schoolQuote.addEventListener("input", () => { schoolQuote.dataset.touched = "1"; });

  document.querySelector("#email-copy").addEventListener("click", async () => {
    const note = document.querySelector("#email-note");
    try { await navigator.clipboard.writeText(emailBody.value); note.textContent = t("Copied."); }
    catch { emailBody.select(); document.execCommand("copy"); note.textContent = t("Copied."); }
  });

  schoolForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!schoolForm.reportValidity()) return;
    const sessions = readSessions().filter((s) => s.date);
    if (!sessions.length) { schoolNote.textContent = t("Add at least one session."); return; }

    const allocated = [];
    for (const s of sessions) {
      const got = window.MWBC_SCHEDULER
        ? window.MWBC_SCHEDULER.allocate(readBookings(), s.date, s.time, s.duration, s.courtsWanted)
        : [];
      if (got.length < s.courtsWanted) {
        schoolNote.textContent = isChinese()
          ? `${displayDate(s.date)} ${displayTime(s.time)}：仅有 ${got.length} 片场地空闲，请先清出其他预订。`
          : `${displayDate(s.date)} ${displayTime(s.time)}: only ${got.length} court(s) free — clear other bookings first.`;
        return;
      }
      allocated.push({ date: s.date, time: s.time, duration: s.duration, courts: got, rate: s.rate, perCourtCents: sessionPerCourtCents(s) });
    }

    const submitBtn = schoolForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    schoolNote.textContent = t("Saving…");
    const payload = {
      schoolName: document.querySelector("#school-name").value.trim(),
      contactName: document.querySelector("#school-contact").value.trim(),
      email: document.querySelector("#school-email").value.trim(),
      phone: document.querySelector("#school-phone").value.trim(),
      notes: document.querySelector("#school-notes").value.trim(),
      quoteCents: Math.round(Number(schoolQuote.value || 0) * 100),
      items: readItems(),
      sessions: allocated
    };
    try {
      await window.MWBC_STORE.createSchoolBooking(payload);
      closeSchoolModal();
      await renderSchoolList();
      showSchoolEmail(payload, allocated);
    } catch (err) {
      const m = String((err && (err.message || err.msg)) || "");
      schoolNote.textContent = /slot_unavailable|exclusion|overlap|23P01/i.test(m)
        ? (isChinese() ? "部分场地已被预订，请先清出冲突预订。" : "Some courts are already booked — clear conflicts first.")
        : (isChinese() ? "保存失败，请重试。" : "Couldn't save. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- auth (Supabase) ---------- */

function isAdminAuthenticated() {
  return !!(window.MWBC_STORE && window.MWBC_STORE.isAuthed());
}

function setAdminState(authenticated) {
  loginScreen.hidden = authenticated;
  adminDashboard.hidden = !authenticated;
  if (authenticated) {
    loginNote.textContent = "";
    renderAll();
  } else {
    closeManualModal();
  }
}

window.refreshAdminSchedule = () => {
  if (isAdminAuthenticated()) renderAll();
};

adminDate.value = isoToday();
manualDate.value = adminDate.value;
bindManualBooking();
bindSchoolBookings();
setAdminState(isAdminAuthenticated());

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const email = document.querySelector("#admin-username").value.trim();
  const password = document.querySelector("#admin-password").value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  loginNote.textContent = t("Signing in…");
  try {
    await window.MWBC_STORE.signIn(email, password);
    loginForm.reset();
    // The dashboard is shown by the mwbc-auth-changed handler below.
  } catch {
    loginNote.textContent = t("Email or password is incorrect.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  await window.MWBC_STORE.signOut();
  document.querySelector("#admin-username").focus();
});

window.addEventListener("mwbc-auth-changed", (event) => {
  setAdminState(!!event.detail?.authed);
});

document.querySelector("#prev-day").addEventListener("click", () => {
  adminDate.value = addDays(adminDate.value, -1);
  closeManualModal();
  renderAll();
});

document.querySelector("#next-day").addEventListener("click", () => {
  adminDate.value = addDays(adminDate.value, 1);
  closeManualModal();
  renderAll();
});

adminDate.addEventListener("change", () => {
  closeManualModal();
  renderAll();
});

newBookingButton?.addEventListener("click", openBlankModal);
closeManualModalButton.addEventListener("click", closeManualModal);
manualModalBackdrop.addEventListener("click", closeManualModal);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!manualModal.hidden) closeManualModal();
  if (schoolModal && !schoolModal.hidden) closeSchoolModal();
  if (emailModal && !emailModal.hidden) closeEmailModal();
});

clearButton.addEventListener("click", () => {
  if (!window.confirm(t("Clear all demo bookings? This cannot be undone."))) return;
  writeBookings([]);
  renderAll();
});

window.addEventListener("mwbc-bookings-updated", () => {
  if (isAdminAuthenticated()) renderAll();
});
window.addEventListener("mwbc-language-changed", () => {
  if (isAdminAuthenticated()) renderAll();
});
window.addEventListener("mwbc-tab-change", (event) => {
  if (event.detail?.tab === "admin") setAdminState(isAdminAuthenticated());
});
})();
