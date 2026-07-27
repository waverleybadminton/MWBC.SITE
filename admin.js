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
const todayButton = document.querySelector("#today-btn");
const listPrevButton = document.querySelector("#list-prev-day");
const listNextButton = document.querySelector("#list-next-day");
const bookingsListTitle = document.querySelector("#bookings-list-title");
const bookingsListShell = document.querySelector("#bookings-list");
let listScope = "day";        // "day" | "all"
let lastScrolledDate = null;  // so we only auto-scroll when the day changes
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
    if (booking.schoolId) openSchoolEditModal(booking.schoolId);
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

  const nowMinutes = adminDate.value === isoToday()
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : -1;

  times.forEach((time, timeIndex) => {
    const slotStart = minutesFromTime(time);
    const isNow = nowMinutes >= slotStart && nowMinutes < slotStart + 30;

    const label = document.createElement("div");
    label.className = "time-label" + (time.endsWith(":00") ? " hour" : "") + (isNow ? " is-now" : "");
    label.textContent = displayTime(time);
    label.style.gridColumn = "1";
    label.style.gridRow = `${timeIndex + 2}`;
    schedule.append(label);

    courts.forEach((court, courtIndex) => {
      const cell = document.createElement("button");
      const occupied = isCourtOccupied(bookings, court, time);
      cell.type = "button";
      cell.className = "schedule-cell" + (time.endsWith(":00") ? " hour-line" : "") + (isNow ? " is-now" : "");
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

  maybeAutoScroll();
}

/* ---------- keeping the useful hours in view ---------- */

// Scroll the board so `minutes` sits just under the sticky court headers.
function scrollScheduleTo(minutes) {
  const box = document.querySelector(".schedule-scroll");
  if (!box || !schedule) return;
  const times = getScheduleTimes();
  let idx = times.findIndex((t) => minutesFromTime(t) >= minutes);
  if (idx < 0) idx = times.length - 1;
  const labels = schedule.querySelectorAll(".time-label");
  const target = labels[Math.max(0, idx)];
  if (!target) return;
  const headerH = schedule.querySelector(".court-header")?.offsetHeight || 0;
  box.scrollTop = Math.max(0, target.offsetTop - headerH - 4);
}

// Land on the part of the day that matters: now (today) or the first booking.
function autoScrollSchedule() {
  if (adminDate.value === isoToday()) {
    const now = new Date();
    scrollScheduleTo(now.getHours() * 60 + now.getMinutes() - 30);
    return;
  }
  const dayBookings = selectedDateBookings();
  const first = dayBookings.length
    ? Math.min(...dayBookings.map((b) => minutesFromTime(b.time)))
    : 16 * 60;
  scrollScheduleTo(first - 30);
}

function maybeAutoScroll() {
  if (lastScrolledDate === adminDate.value) return;
  window.requestAnimationFrame(() => {
    const box = document.querySelector(".schedule-scroll");
    // Board not on screen yet (e.g. still logging in) — leave it for the next render.
    if (!box || box.clientHeight === 0) return;
    lastScrolledDate = adminDate.value;
    autoScrollSchedule();
  });
}

function upcomingBookings() {
  const today = isoToday();
  return readBookings()
    .filter((b) => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || minutesFromTime(a.time) - minutesFromTime(b.time));
}

function renderBookings() {
  const dayBookings = selectedDateBookings();
  // Metrics always describe the selected day, whatever the list is showing.
  const totalMinutes = courts.length * (closeHour - openingHour(adminDate.value)) * 60;
  const bookedMinutes = dayBookings.reduce((sum, booking) => {
    return sum + Number(booking.duration || 0) * Math.max(1, bookingCourts(booking).length);
  }, 0);
  bookingCount.textContent = dayBookings.length;
  revenue.textContent = `$${dayBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0)}`;
  utilisation.textContent = `${Math.round((bookedMinutes / totalMinutes) * 100)}%`;
  selectedDayLabel.textContent = adminDate.value === isoToday()
    ? `${t("Today")} · ${displayDate(adminDate.value, { short: true })}`
    : displayDate(adminDate.value);
  selectedDaySubtitle.textContent = isChinese()
    ? `共 14 片场地，${dayBookings.length} 个预订`
    : `${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"} across 14 courts`;

  const bookings = listScope === "all" ? upcomingBookings() : dayBookings;
  if (bookingsListTitle) {
    bookingsListTitle.textContent = listScope === "all" ? t("All upcoming bookings") : t("Bookings");
  }

  bookingRows.innerHTML = "";
  if (!bookings.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="9">${listScope === "all"
      ? t("No upcoming bookings.")
      : t("No bookings for this day yet. Click any empty slot above to add one.")}</td>`;
    bookingRows.append(row);
    return;
  }

  bookings.forEach((booking) => {
    const row = document.createElement("tr");
    const sourceClass = booking.source === "School" ? "src-school"
      : (booking.source === "Phone" || booking.source === "Manual" ? "src-phone" : "src-online");
    const paidClass = booking.status === "Paid" ? "pill-paid" : "pill-unpaid";
    row.innerHTML = `
      <td class="col-date">${displayDate(booking.date, { short: true })}</td>
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
let editingSchoolId = null;

// When editing, the school's own bookings shouldn't count as "busy".
function schoolPool() {
  return editingSchoolId ? readBookings().filter((b) => b.schoolId !== editingSchoolId) : readBookings();
}

// School court-hire rates (per hour, per court): off-peak $24, peak (5pm+) $34.
const SCHOOL_RATE_OFFPEAK = 24;
const SCHOOL_RATE_PEAK = 34;
// Per-court price for a session, summed over 30-min segments at the off-peak
// ($24) / peak ($34, from 5pm) rate — so a session that straddles 5pm is priced
// correctly and automatically (e.g. 4–6pm = 1h@$24 + 1h@$34 = $58/court).
function schoolPerCourtCents(date, startMin, durationMin) {
  let total = 0;
  for (let offset = 0; offset < durationMin; offset += 30) {
    const seg = Math.min(30, durationMin - offset);
    const rate = (startMin + offset) >= 17 * 60 ? SCHOOL_RATE_PEAK : SCHOOL_RATE_OFFPEAK;
    total += rate * (seg / 60);
  }
  return Math.round(total * 100);
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
  return window.MWBC_SCHEDULER.allocate(schoolPool(), date, time, duration, courts.length).length;
}

function addSessionRow(date) {
  const row = document.createElement("div");
  row.className = "session-row";
  row.innerHTML = `
    <label>${t("Date")}<input type="date" class="s-date" required></label>
    <label>${t("Start time")}<select class="s-time">${timeOptionsHTML("09:00")}</select></label>
    <label>${t("Duration")}<select class="s-duration">${durationOptionsHTML(120)}</select></label>
    <label>${t("Courts")}<input type="number" class="s-courts" min="1" max="14" value="14"></label>
    <span class="s-price" aria-label="${t("Session price")}"></span>
    <span class="s-avail"></span>
    <button type="button" class="s-remove" aria-label="${t("Remove")}">&times;</button>`;
  const dateInput = row.querySelector(".s-date");
  dateInput.value = date || adminDate.value;
  dateInput.min = isoToday();
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
    row
  })).map((s) => ({
    ...s,
    // Price is always auto: peak/off-peak segments, no per-session override.
    perCourtCents: s.date ? schoolPerCourtCents(s.date, minutesFromTime(s.time), s.duration) : 0
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
    const lineTotal = s.perCourtCents / 100 * s.courtsWanted;
    const priceEl = s.row.querySelector(".s-price");
    if (priceEl) priceEl.textContent = s.date ? `$${lineTotal.toFixed(2)}` : "";
    quoteAuto += lineTotal;
  });
  readItems().forEach((it) => { quoteAuto += it.amountCents / 100; });
  if (schoolQuote.dataset.touched !== "1") schoolQuote.value = Math.round(quoteAuto * 100) / 100;
}

function openSchoolModal() {
  editingSchoolId = null;
  schoolForm.reset();
  schoolQuote.dataset.touched = "";
  sessionRows.innerHTML = "";
  itemRows.innerHTML = "";
  schoolNote.textContent = "";
  const pasteNote = document.querySelector("#paste-note");
  if (pasteNote) pasteNote.textContent = "";
  const pasteWrap = document.querySelector(".paste-fill");
  if (pasteWrap) pasteWrap.open = false;
  document.querySelector("#school-booking-title").textContent = t("New school booking");
  schoolForm.querySelector('button[type="submit"]').textContent = t("Create booking");
  addSessionRow(adminDate.value);
  schoolModal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => document.querySelector("#school-name").focus(), 0);
}

// Edit an existing school booking: pre-fill the modal with its sessions + items.
async function openSchoolEditModal(id) {
  if (!schoolHeaders.find((x) => x.id === id)) schoolHeaders = await window.MWBC_STORE.listSchoolBookings();
  const h = schoolHeaders.find((x) => x.id === id);
  if (!h) return;
  openSchoolModal();
  editingSchoolId = id;
  sessionRows.innerHTML = "";
  itemRows.innerHTML = "";
  document.querySelector("#school-name").value = h.school_name;
  document.querySelector("#school-contact").value = h.contact_name || "";
  document.querySelector("#school-email").value = h.contact_email || "";
  document.querySelector("#school-phone").value = h.contact_phone || "";
  document.querySelector("#school-reference").value = h.reference || "";
  document.querySelector("#school-notes").value = h.notes || "";

  const sessions = readBookings().filter((b) => b.schoolId === id)
    .sort((a, b) => a.date.localeCompare(b.date) || minutesFromTime(a.time) - minutesFromTime(b.time));
  sessions.forEach((b) => {
    addSessionRow(b.date);
    const row = sessionRows.lastElementChild;
    row.querySelector(".s-date").value = b.date;
    const timeSel = row.querySelector(".s-time");
    if (!Array.from(timeSel.options).some((o) => o.value === b.time)) {
      timeSel.insertAdjacentHTML("beforeend", `<option value="${b.time}">${displayTime(b.time)}</option>`);
    }
    timeSel.value = b.time;
    row.querySelector(".s-duration").value = String(b.duration);
    row.querySelector(".s-courts").value = String(b.courtCount);
  });
  if (!sessions.length) addSessionRow(adminDate.value);
  (h.items || []).forEach((it) => addItemRow(it.description, Number(it.amountCents || 0) / 100));

  schoolQuote.value = (Number(h.quote_cents || 0) / 100);
  schoolQuote.dataset.touched = "1";
  refreshSchoolCalc();
  document.querySelector("#school-booking-title").textContent = t("Edit school booking");
  schoolForm.querySelector('button[type="submit"]').textContent = t("Update booking");
}
function closeSchoolModal() { schoolModal.hidden = true; document.body.classList.remove("modal-open"); }
function closeEmailModal() { emailModal.hidden = true; document.body.classList.remove("modal-open"); }

// Long-form email date/time, e.g. "Thursday 30 July 2026" and "4:00 pm".
function emailDate(dateValue) {
  return new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${dateValue}T12:00:00`));
}
function emailTime(time) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}
function shortNameFor(p) {
  if (p.shortName && p.shortName.trim()) return p.shortName.trim();
  if (p.reference && p.reference.trim()) return p.reference.trim().split(/[-\s/]/)[0];
  return p.schoolName;
}

function composeSchoolEmail(p, sessions) {
  const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
  const short = shortNameFor(p);
  const L = [];
  L.push(`Dear ${p.contactName || short},`, "");
  L.push(`Thank you for choosing Mount Waverley Badminton Centre. This email confirms the following court bookings for ${short}.`, "");
  L.push("BOOKING DETAILS");
  L.push(`School: ${p.schoolName}`);
  if (p.reference) L.push(`Booking reference: ${p.reference}`);
  L.push("");
  sessions.forEach((s) => {
    const end = timeFromMinutes(minutesFromTime(s.time) + Number(s.duration));
    const n = s.courts.length;
    L.push(emailDate(s.date));
    L.push(`${emailTime(s.time)}–${emailTime(end)} · ${n} court${n > 1 ? "s" : ""}`, "");
  });
  L.push("BOOKING FEES");
  L.push("Off-peak rate: $24 per court, per hour");
  L.push("Weekdays before 5:00 pm");
  L.push("Peak rate: $34 per court, per hour");
  L.push("Weekdays from 5:00 pm, weekends and public holidays", "");
  if (p.items && p.items.length) {
    L.push("ADDITIONAL ITEMS");
    p.items.forEach((it) => L.push(`${it.description || "Item"} — ${money(it.amountCents)}`));
    L.push("");
  }
  L.push("Please provide a purchase-order number or confirm the appropriate billing contact so that we can issue the invoice.", "");
  L.push("CANCELLATION AND CHANGES");
  L.push(`These courts are reserved exclusively for ${short} and removed from general availability. Accordingly, confirmed school and large-group bookings are non-refundable.`);
  L.push("Any request to change the date, time or number of courts is subject to availability and approval by Mount Waverley Badminton Centre. Where a change cannot be accommodated, the original booking fee will remain payable.", "");
  L.push("VENUE");
  L.push("Mount Waverley Badminton Centre");
  L.push("Unit 59, 170 Forster Road");
  L.push("Mount Waverley VIC 3149");
  L.push("Mobile: 0452 242 399");
  L.push("Email: booking.mwbc@gmail.com");
  L.push("Website: www.mwbcbadminton.com.au", "");
  L.push("Please review the details above and let me know promptly if anything requires correction.");
  L.push(`We look forward to welcoming ${short} and hosting your badminton matches.`, "");
  L.push("Kind regards,");
  L.push("MWBC");
  L.push("Phone: 0452 242 399");
  L.push("Tel: 03 8555 0922");
  L.push("Address: 59/170 Forster Rd, Mt Waverley, VIC 3149");
  L.push("Email: booking.mwbc@gmail.com");
  L.push("Website: http://www.mwbcbadminton.com.au");
  return L.join("\n");
}

/* ---------- paste-an-email → auto-fill ---------- */

const OUR_EMAILS = ["booking.mwbc@gmail.com"];
const OUR_PHONE_DIGITS = ["0452242399", "0385550922"];
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12
};
const pad2 = (n) => String(n).padStart(2, "0");
const digitsOnly = (s) => String(s || "").replace(/\D/g, "");

function guessYear(mo, d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let y = today.getFullYear();
  if (new Date(y, mo - 1, d) < today) y += 1;
  return y;
}

function parseDate(str) {
  // "30 July 2026" / "30th July" / "30 Jul"
  let m = str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s*,?\s*(\d{4})?/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const d = +m[1], mo = MONTHS[m[2].toLowerCase()], y = m[3] ? +m[3] : guessYear(mo, d);
    if (d >= 1 && d <= 31) return `${y}-${pad2(mo)}-${pad2(d)}`;
  }
  // "July 30th, 2026" / "Jul 30"
  m = str.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s*(\d{4})?/);
  if (m && MONTHS[m[1].toLowerCase()]) {
    const mo = MONTHS[m[1].toLowerCase()], d = +m[2], y = m[3] ? +m[3] : guessYear(mo, d);
    if (d >= 1 && d <= 31) return `${y}-${pad2(mo)}-${pad2(d)}`;
  }
  m = str.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return `${m[1]}-${pad2(+m[2])}-${pad2(+m[3])}`;
  m = str.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (m) { let d = +m[1], mo = +m[2], y = +m[3]; if (y < 100) y += 2000; if (d <= 31 && mo <= 12) return `${y}-${pad2(mo)}-${pad2(d)}`; }
  return null;
}

function parseTimeRange(str) {
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\s*(?:–|-|—|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
  if (!m) return null;
  const to24 = (h, ap, other) => {
    ap = (ap || other || "").toLowerCase().replace(/\./g, "");
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h;
  };
  const sh = to24(+m[1], m[3], m[6]), sm = m[2] ? +m[2] : 0;
  const eh = to24(+m[4], m[6], m[3]), em = m[5] ? +m[5] : 0;
  const snap = (x) => Math.round(x / 30) * 30;
  const start = snap(sh * 60 + sm), end = snap(eh * 60 + em);
  if (end <= start) return null;
  return { startMin: start, duration: Math.max(30, end - start) };
}

function parseCourts(str) {
  const m = str.match(/(\d{1,2})\s*(?:x\s*)?courts?\b/i)     // "8 courts", "8 x courts"
    || str.match(/\bcourts?\s*[:\-x]?\s*(\d{1,2})/i)          // "courts: 8", "court x8"
    || str.match(/(\d{1,2})\s*(?:×|x)\s*court/i);
  if (m) { const n = +m[1]; if (n >= 1 && n <= 14) return n; }
  return null;
}

function parseBookingEmail(text) {
  const out = { schoolName: "", contactName: "", email: "", phone: "", reference: "", sessions: [] };
  const lines = text.split(/\r?\n/);

  const emails = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
    .filter((e) => !OUR_EMAILS.includes(e.toLowerCase()));
  if (emails.length) out.email = emails[0];

  const phones = (text.match(/(?:\+?61[\s-]?|0)[2-478](?:[\s-]?\d){7,9}/g) || [])
    .map((p) => p.trim())
    .filter((p) => !OUR_PHONE_DIGITS.includes(digitsOnly(p).replace(/^61/, "0")));
  if (phones.length) out.phone = phones[0];

  const cleanName = (s) => s.trim().replace(/^(?:for|from|at|the)\s+/i, "").replace(/['".;,\s]+$/, "");
  let m = text.match(/School\s*(?:\/\s*group)?\s*(?:name)?\s*[:\-]\s*(.+)/i);
  if (m) out.schoolName = cleanName(m[1]);
  if (!out.schoolName) {
    // A proper-noun phrase ending in a school-type word, even mid-sentence
    // (e.g. "…book courts for Carey Baptist Grammar School.").
    m = text.match(/([A-Z][A-Za-z'&.\-]+(?:\s+(?:[A-Z][A-Za-z'&.\-]+|of|the|and)){0,6}\s+(?:Grammar School|Primary School|Secondary College|High School|College|Grammar|School|Academy|University|Institute))\b/);
    if (m) out.schoolName = cleanName(m[1]);
  }
  if (!out.schoolName) {
    const kw = /(College|Grammar|Primary School|Secondary College|High School|\bSchool\b|Academy|University|Club)/i;
    const cand = lines.find((l) => kw.test(l) && l.trim().length < 60 && !/rate|court|booking|venue|website|email|phone|www\./i.test(l));
    if (cand) out.schoolName = cleanName(cand);
  }

  m = text.match(/(?:booking\s*)?reference\s*[:\-]\s*([A-Za-z0-9\-\/]+)/i) || text.match(/\b(?:PO|P\.O\.)\s*(?:number|no\.?|#)?\s*[:#]?\s*([A-Za-z0-9\-\/]{3,})/i);
  if (m) out.reference = m[1].trim();

  let name = null;
  m = text.match(/\b(?:kind\s+regards|warm\s+regards|regards|many\s+thanks|thanks|thank you|cheers|sincerely|best|yours(?:\s+sincerely)?)\b[,:]?\s*\n?\s*([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+)?)/i);
  if (m && m[1].toUpperCase() !== "MWBC" && !/^(For|The|To|Hi|Hello|We|I|You|Please)$/i.test(m[1])) name = m[1];
  if (!name) { m = text.match(/\bmy name is\s+([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+)?)/i); if (m) name = m[1]; }
  if (!name) { m = text.match(/\bDear\s+([A-Z][A-Za-z'\-]+)/); if (m && m[1].toUpperCase() !== "MWBC") name = m[1]; }
  if (name) out.contactName = name.trim();

  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const date = parseDate(lines[i]);
    if (!date) continue;
    let tr = parseTimeRange(lines[i]);
    let courts = parseCourts(lines[i]);
    for (let j = 1; j <= 2 && i + j < lines.length && (!tr || !courts); j++) {
      if (!tr) tr = parseTimeRange(lines[i + j]);
      if (!courts) courts = parseCourts(lines[i + j]);
    }
    const key = `${date}_${tr ? tr.startMin : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.sessions.push({ date, startMin: tr ? tr.startMin : 9 * 60, duration: tr ? tr.duration : 120, courts: courts || 1 });
  }
  return out;
}

// Build a readable booking reference, e.g. "MLC-2026-0730".
function initialsFrom(name) {
  const skip = new Set(["the", "of", "and", "for", "at", "a"]);
  const words = String(name || "").replace(/[^A-Za-z\s'&-]/g, " ").split(/\s+/).filter(Boolean);
  const init = words.filter((w) => !skip.has(w.toLowerCase())).map((w) => w[0].toUpperCase()).join("");
  return (init || "GRP").slice(0, 5);
}
function autoReference(schoolName, sessions) {
  const init = initialsFrom(schoolName);
  const dates = (sessions || []).map((s) => s.date).filter(Boolean).sort();
  let year = new Date().getFullYear();
  let md;
  if (dates.length) { const [y, m, d] = dates[0].split("-"); year = +y; md = `${m}${d}`; }
  else { const n = new Date(); md = `${pad2(n.getMonth() + 1)}${pad2(n.getDate())}`; }
  return `${init}-${year}-${md}`;
}

const DURATION_OPTS = [60, 90, 120, 150, 180, 210, 240, 270, 300];
function applyParsedToForm(p) {
  if (p.schoolName) document.querySelector("#school-name").value = p.schoolName;
  if (p.contactName) document.querySelector("#school-contact").value = p.contactName;
  if (p.email) document.querySelector("#school-email").value = p.email;
  if (p.phone) document.querySelector("#school-phone").value = p.phone;
  const refField = document.querySelector("#school-reference");
  if (p.reference) refField.value = p.reference;
  else if (!refField.value.trim() && (p.schoolName || p.sessions.length)) {
    refField.value = autoReference(p.schoolName || document.querySelector("#school-name").value, p.sessions);
  }
  if (p.sessions.length) {
    sessionRows.innerHTML = "";
    p.sessions.forEach((s) => {
      addSessionRow(s.date);
      const row = sessionRows.lastElementChild;
      row.querySelector(".s-date").value = s.date;
      const timeStr = timeFromMinutes(s.startMin);
      const timeSel = row.querySelector(".s-time");
      if (!Array.from(timeSel.options).some((o) => o.value === timeStr)) {
        timeSel.insertAdjacentHTML("beforeend", `<option value="${timeStr}">${displayTime(timeStr)}</option>`);
      }
      timeSel.value = timeStr;
      const dur = DURATION_OPTS.reduce((a, b) => (Math.abs(b - s.duration) < Math.abs(a - s.duration) ? b : a), 120);
      row.querySelector(".s-duration").value = String(dur);
      row.querySelector(".s-courts").value = String(s.courts);
    });
  }
  refreshSchoolCalc();
  return p.sessions.length;
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
  showSchoolEmail({ schoolName: h.school_name, contactName: h.contact_name, email: h.contact_email, phone: h.contact_phone, reference: h.reference, items: h.items || [] }, sessions);
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
        <button class="table-action" type="button" data-school-edit="${h.id}">${t("Edit")}</button>
        <button class="table-action" type="button" data-school-email="${h.id}">${t("Email")}</button>
        <button class="table-action danger" type="button" data-school-remove="${h.id}">${t("Remove")}</button>
      </td>`;
    schoolBookingsBody.append(tr);
  });
  schoolBookingsBody.querySelectorAll("[data-school-edit]").forEach((b) => b.addEventListener("click", () => openSchoolEditModal(b.dataset.schoolEdit)));
  schoolBookingsBody.querySelectorAll("[data-school-email]").forEach((b) => b.addEventListener("click", () => emailForSchool(b.dataset.schoolEmail)));
  schoolBookingsBody.querySelectorAll("[data-school-remove]").forEach((b) => b.addEventListener("click", () => removeSchool(b.dataset.schoolRemove)));
}

function bindSchoolBookings() {
  if (!schoolForm) return;
  document.querySelector("#new-school-btn").addEventListener("click", openSchoolModal);
  document.querySelector("#add-session-btn").addEventListener("click", () => addSessionRow());
  document.querySelector("#add-item-btn").addEventListener("click", () => addItemRow());

  document.querySelector("#paste-fill-btn").addEventListener("click", async () => {
    const note = document.querySelector("#paste-note");
    const btn = document.querySelector("#paste-fill-btn");
    const text = document.querySelector("#paste-email").value;
    if (!text.trim()) { note.textContent = t("Paste an email first."); return; }

    btn.disabled = true;
    note.textContent = isChinese() ? "正在读取邮件…" : "Reading the email…";
    // Try the AI parser first; fall back to the built-in pattern matcher.
    let parsed = null;
    if (window.MWBC_STORE && window.MWBC_STORE.parseEmail) {
      try { parsed = await window.MWBC_STORE.parseEmail(text); } catch { parsed = null; }
    }
    const usedAi = !!parsed;
    if (!parsed) parsed = parseBookingEmail(text);
    const found = applyParsedToForm(parsed);
    btn.disabled = false;

    const tag = usedAi ? "" : (isChinese() ? "（基础识别）" : " (basic)");
    note.textContent = isChinese()
      ? `已识别 ${found} 个场次，请核对并修改。${tag}`
      : `Filled in ${found} session(s) — please review and adjust.${tag}`;
  });
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
        ? window.MWBC_SCHEDULER.allocate(schoolPool(), s.date, s.time, s.duration, s.courtsWanted)
        : [];
      if (got.length < s.courtsWanted) {
        schoolNote.textContent = isChinese()
          ? `${displayDate(s.date)} ${displayTime(s.time)}：仅有 ${got.length} 片场地空闲，请先清出其他预订。`
          : `${displayDate(s.date)} ${displayTime(s.time)}: only ${got.length} court(s) free — clear other bookings first.`;
        return;
      }
      allocated.push({ date: s.date, time: s.time, duration: s.duration, courts: got, perCourtCents: s.perCourtCents });
    }

    const submitBtn = schoolForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    schoolNote.textContent = t("Saving…");
    const schoolName = document.querySelector("#school-name").value.trim();
    // Auto-assign a booking reference if staff didn't set one, and reflect it in the field.
    let reference = document.querySelector("#school-reference").value.trim();
    if (!reference) { reference = autoReference(schoolName, allocated); document.querySelector("#school-reference").value = reference; }
    const payload = {
      schoolName,
      contactName: document.querySelector("#school-contact").value.trim(),
      email: document.querySelector("#school-email").value.trim(),
      phone: document.querySelector("#school-phone").value.trim(),
      reference,
      notes: document.querySelector("#school-notes").value.trim(),
      quoteCents: Math.round(Number(schoolQuote.value || 0) * 100),
      items: readItems(),
      sessions: allocated
    };
    try {
      if (editingSchoolId) {
        await window.MWBC_STORE.updateSchoolBooking(editingSchoolId, payload);
      } else {
        await window.MWBC_STORE.createSchoolBooking(payload);
      }
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

function goToDate(date) {
  adminDate.value = date;
  closeManualModal();
  renderAll();
}

document.querySelector("#prev-day").addEventListener("click", () => goToDate(addDays(adminDate.value, -1)));
document.querySelector("#next-day").addEventListener("click", () => goToDate(addDays(adminDate.value, 1)));
todayButton?.addEventListener("click", () => goToDate(isoToday()));

// The bookings list gets its own day stepper, so you never scroll back up.
listPrevButton?.addEventListener("click", () => goToDate(addDays(adminDate.value, -1)));
listNextButton?.addEventListener("click", () => goToDate(addDays(adminDate.value, 1)));

document.querySelectorAll(".list-scope [data-scope]").forEach((button) => {
  button.addEventListener("click", () => {
    listScope = button.dataset.scope;
    document.querySelectorAll(".list-scope [data-scope]").forEach((b) => b.classList.toggle("active", b === button));
    bookingsListShell?.classList.toggle("scope-day", listScope === "day");
    renderBookings();
  });
});

document.querySelectorAll(".time-jump [data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const now = new Date();
    const target = {
      now: now.getHours() * 60 + now.getMinutes() - 30,
      morning: 8 * 60,
      afternoon: 12 * 60,
      evening: 17 * 60
    }[button.dataset.jump];
    scrollScheduleTo(target);
  });
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
