(() => {
const bookingKey = "mwbcBookings";
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
const adminSessionKey = "mwbcAdminAuthenticated";
const newBookingButton = document.querySelector("#new-booking-btn");
const manualModal = document.querySelector("#manual-modal");
const closeManualModalButton = document.querySelector("#close-manual-modal");
const manualModalBackdrop = document.querySelector("#manual-modal-backdrop");

const ADMIN_USER = "admin";
const ADMIN_PASS = "MWBC2026";

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
  try {
    return JSON.parse(localStorage.getItem(bookingKey)) || [];
  } catch {
    return [];
  }
}

function writeBookings(bookings) {
  localStorage.setItem(bookingKey, JSON.stringify(bookings));
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

function bookingClass(booking) {
  if (booking.status === "Unpaid" || booking.status === "Hold") return "booking-unpaid";
  return booking.source === "Phone" || booking.source === "Manual" ? "booking-phone" : "booking-online";
}

function bookingLabel(booking) {
  const contact = booking.phone || booking.email || "";
  const notes = booking.notes ? ` · ${booking.notes}` : "";
  return `${booking.name}${contact ? ` · ${contact}` : ""}${notes}`;
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
  document.querySelector("#manual-name").value = "";
  document.querySelector("#manual-phone").value = "";
  document.querySelector("#manual-email").value = "";
  document.querySelector("#manual-notes").value = "";
  manualCourtCount.value = "1";
  manualStatus.value = "Unpaid";
  manualNote.textContent = "";
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

function cancelBooking(id) {
  const booking = readBookings().find((item) => item.id === id);
  if (!booking) return;
  const label = `${booking.name} · ${displayTime(booking.time)}`;
  if (!window.confirm(`${t("Cancel this booking and free the court?")}\n\n${label}`)) return;
  writeBookings(readBookings().filter((item) => item.id !== id));
  renderAll();
}

/* ---------- rendering ---------- */

function renderDayTabs() {
  dayTabs.innerHTML = "";
  const today = isoToday();
  const base = adminDate.value || today;
  for (let i = 0; i < 7; i++) {
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

function renderSchedule() {
  const times = getScheduleTimes();
  const bookings = selectedDateBookings();
  schedule.style.setProperty("--time-count", times.length);
  schedule.innerHTML = "";

  const corner = document.createElement("div");
  corner.className = "schedule-corner";
  corner.style.gridColumn = "1";
  corner.style.gridRow = "1";
  corner.textContent = t("Court");
  schedule.append(corner);

  times.forEach((time, timeIndex) => {
    const header = document.createElement("div");
    header.className = "time-header";
    header.textContent = time.endsWith(":00") ? displayTime(time) : "";
    header.style.gridColumn = `${timeIndex + 2}`;
    header.style.gridRow = "1";
    schedule.append(header);
  });

  courts.forEach((court, courtIndex) => {
    const courtLabel = document.createElement("div");
    courtLabel.className = "court-label";
    courtLabel.textContent = displayCourt(court);
    courtLabel.style.gridColumn = "1";
    courtLabel.style.gridRow = `${courtIndex + 2}`;
    schedule.append(courtLabel);

    times.forEach((time, timeIndex) => {
      const cell = document.createElement("button");
      const occupied = isCourtOccupied(bookings, court, time);
      cell.type = "button";
      cell.className = "schedule-cell";
      cell.dataset.court = court;
      cell.dataset.time = time;
      cell.style.gridColumn = `${timeIndex + 2}`;
      cell.style.gridRow = `${courtIndex + 2}`;
      cell.setAttribute("aria-label", occupied
        ? (isChinese() ? `${displayCourt(court)} ${displayTime(time)} 已有预订` : `${court} at ${displayTime(time)} is booked`)
        : (isChinese() ? `预订 ${displayCourt(court)} ${displayTime(time)}` : `Book ${court} at ${displayTime(time)}`));
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
      block.style.gridColumn = `${startIndex + 2} / span ${slots}`;
      block.style.gridRow = `${courtIndex + 2}`;
      block.title = isChinese()
        ? `${displayCourt(court)}，${displayTime(booking.time)}，${booking.duration} 分钟 — 点击取消`
        : `${court}, ${displayTime(booking.time)}, ${booking.duration} min — click to cancel`;
      block.setAttribute("aria-label", isChinese()
        ? `取消预订：${booking.name}，${displayCourt(court)}，${displayTime(booking.time)}`
        : `Cancel booking: ${booking.name}, ${court} at ${displayTime(booking.time)}`);
      block.textContent = bookingLabel(booking);
      block.addEventListener("click", () => cancelBooking(booking.id));
      schedule.append(block);
    });
  });
}

function renderBookings() {
  const allBookings = readBookings();
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
    row.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.phone || booking.email || ""}</td>
      <td>${isChinese() ? `${displayTime(booking.time)}，${booking.duration} 分钟` : `${displayTime(booking.time)} for ${booking.duration} min`}</td>
      <td>${bookingCourts(booking).map(displayCourt).join(isChinese() ? "、" : ", ")}</td>
      <td>${t(booking.source || "Online")}</td>
      <td>$${booking.price || 0}</td>
      <td>${t(booking.status)}</td>
      <td><button class="table-action" type="button" data-delete="${booking.id}">${t("Remove")}</button></td>
    `;
    bookingRows.append(row);
  });

  bookingRows.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      writeBookings(allBookings.filter((booking) => booking.id !== button.dataset.delete));
      renderAll();
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

function allocateManualCourts(date, time, duration, firstCourt, count) {
  // Best-fit allocation via the shared scheduler; falls back to a simple scan.
  const ranked = window.MWBC_SCHEDULER
    ? window.MWBC_SCHEDULER.allocate(readBookings(), date, time, duration, courts.length)
    : courts.filter((court) => !hasConflict({ date, time, duration, court }));
  if (firstCourt && firstCourt !== "auto") {
    // Staff picked a specific court — honour it, then best-fit the rest.
    return [...ranked.filter((c) => c === firstCourt), ...ranked.filter((c) => c !== firstCourt)].slice(0, count);
  }
  return ranked.slice(0, count);
}

function bindManualBooking() {
  manualForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!manualForm.reportValidity()) return;
    const courtCount = Number(manualCourtCount.value || 1);
    const assignedCourts = allocateManualCourts(manualDate.value, manualTime.value, manualDuration.value, manualCourt.value, courtCount);

    if (assignedCourts.length < courtCount) {
      manualNote.textContent = isChinese()
        ? `该时段仅有 ${assignedCourts.length} 片场地可用。请选择其他时间或减少场地数量。`
        : `Only ${assignedCourts.length} court(s) free at that time. Pick another time or reduce the court count.`;
      return;
    }

    const booking = {
      id: `MWBC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: document.querySelector("#manual-name").value.trim() || t("Reserved"),
      phone: document.querySelector("#manual-phone").value.trim(),
      email: document.querySelector("#manual-email").value.trim(),
      court: assignedCourts[0],
      courts: assignedCourts,
      courtCount,
      date: manualDate.value,
      time: manualTime.value,
      duration: manualDuration.value,
      status: manualStatus.value,
      source: "Phone",
      notes: document.querySelector("#manual-notes").value.trim(),
      price: computePrice(manualDate.value, manualTime.value, manualDuration.value) * courtCount,
      createdAt: new Date().toISOString()
    };

    writeBookings([booking, ...readBookings()]);
    manualForm.reset();
    manualBookingTitle.textContent = t("New booking");
    manualDate.value = adminDate.value;
    closeManualModal();
    renderAll();
  });
}

function renderAll() {
  manualDate.value = adminDate.value;
  renderManualOptions();
  renderDayTabs();
  renderSchedule();
  renderBookings();
}

/* ---------- auth ---------- */

function isAdminAuthenticated() {
  return sessionStorage.getItem(adminSessionKey) === "true";
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
setAdminState(isAdminAuthenticated());

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const username = document.querySelector("#admin-username").value.trim();
  const password = document.querySelector("#admin-password").value;
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    loginNote.textContent = t("Username or password is incorrect.");
    return;
  }
  sessionStorage.setItem(adminSessionKey, "true");
  loginForm.reset();
  setAdminState(true);
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(adminSessionKey);
  setAdminState(false);
  document.querySelector("#admin-username").focus();
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
  if (event.key === "Escape" && !manualModal.hidden) closeManualModal();
});

clearButton.addEventListener("click", () => {
  if (!window.confirm(t("Clear all demo bookings? This cannot be undone."))) return;
  writeBookings([]);
  renderAll();
});

window.addEventListener("mwbc-bookings-updated", renderAll);
window.addEventListener("mwbc-language-changed", () => {
  if (isAdminAuthenticated()) renderAll();
});
window.addEventListener("mwbc-tab-change", (event) => {
  if (event.detail?.tab === "admin") setAdminState(isAdminAuthenticated());
});
})();
