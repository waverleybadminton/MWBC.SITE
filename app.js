(() => {
const courts = Array.from({ length: 14 }, (_, index) => `Court ${index + 1}`);
const bookingKey = "mwbcBookings";
const i18n = window.MWBC_I18N;
const t = (key, variables) => i18n?.t(key, variables) || key;
const isChinese = () => i18n?.isChinese() || false;

const dateInput = document.querySelector("#booking-date");
const durationInput = document.querySelector("#booking-duration");
const courtCountInput = document.querySelector("#court-count");
const slotList = document.querySelector("#slot-list");
const summarySelection = document.querySelector("#summary-selection");
const summaryCancellation = document.querySelector("#summary-cancellation");
const summaryPrice = document.querySelector("#summary-price");
const form = document.querySelector("#booking-form");
const formNote = document.querySelector("#form-note");
const progressItems = Array.from(document.querySelectorAll(".progress span"));
const calendarGrid = document.querySelector("#calendar-grid");
const calendarMonth = document.querySelector("#calendar-month");
const selectedDateLabel = document.querySelector("#selected-date-label");
const policyInput = document.querySelector("#policy");
const policyCopy = document.querySelector("#policy-copy");
const submitButton = document.querySelector("#submit-booking");
const confirmationId = document.querySelector("#confirmation-id");
const confirmationDate = document.querySelector("#confirmation-date");
const confirmationTime = document.querySelector("#confirmation-time");
const confirmationDuration = document.querySelector("#confirmation-duration");
const confirmationCourts = document.querySelector("#confirmation-courts");
const confirmationTotal = document.querySelector("#confirmation-total");
const confirmationCancellation = document.querySelector("#confirmation-cancellation");
const confirmationEmail = document.querySelector("#confirmation-email");

let selectedSlot = null;
let slotFilter = "all";
let visibleMonth = new Date();
let lastConfirmedBooking = null;

function isoToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
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

function parseSlotTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

function minutesFromTime(time) {
  const { hour, minute } = parseSlotTime(time);
  return hour * 60 + minute;
}

function displayTime(hour, minute) {
  if (isChinese()) {
    const period = hour < 12 ? "上午" : hour < 18 ? "下午" : "晚上";
    const hour12 = hour % 12 || 12;
    return `${period} ${hour12}:${String(minute).padStart(2, "0")}`;
  }
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")}${suffix}`;
}

function displayTimeValue(time) {
  const { hour, minute } = parseSlotTime(time);
  return displayTime(hour, minute);
}

function formatDateLabel(dateValue) {
  return new Intl.DateTimeFormat(i18n?.locale() || "en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(`${dateValue}T12:00:00`));
}

function monthLabel(date) {
  return new Intl.DateTimeFormat(i18n?.locale() || "en-AU", {
    month: "long",
    year: "numeric"
  }).format(date);
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

function selectedCourtCount() {
  return Number(courtCountInput.value || 1);
}

function computePrice(dateValue, time, duration, courtCount = selectedCourtCount()) {
  const start = minutesFromTime(time);
  const durationMinutes = Number(duration);
  let perCourtTotal = 0;

  for (let offset = 0; offset < durationMinutes; offset += 30) {
    const segmentMinutes = Math.min(30, durationMinutes - offset);
    perCourtTotal += hourlyRate(dateValue, start + offset) * (segmentMinutes / 60);
  }

  return Math.round(perCourtTotal * courtCount);
}

function cancellationHours(dateValue, courtCount = selectedCourtCount()) {
  return (isWeekend(dateValue) ? 48 : 24) * courtCount;
}

function formatCancellationNotice(hours) {
  if (hours > 72) {
    const days = hours / 24;
    return isChinese() ? `${days} 天` : `${days} ${days === 1 ? "day" : "days"}`;
  }
  return isChinese() ? `${hours} 小时` : `${hours} hours`;
}

function formatDuration(minutes) {
  const value = Number(minutes);
  if (value < 60) return isChinese() ? `${value} 分钟` : `${value} minutes`;
  const hours = value / 60;
  if (isChinese()) return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? "hour" : "hours"}`;
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + Number(durationA);
  const endB = startB + Number(durationB);
  return startA < endB && startB < endA;
}

function bookingCourts(booking) {
  if (Array.isArray(booking.courts)) return booking.courts;
  if (booking.court) return [booking.court];
  return [];
}

function availableCourtsFor(dateValue, time, duration) {
  const start = minutesFromTime(time);
  const bookings = readBookings().filter((booking) => booking.date === dateValue);
  return courts.filter((court) => {
    return !bookings.some((booking) => {
      if (!bookingCourts(booking).includes(court)) return false;
      return overlaps(start, duration, minutesFromTime(booking.time), booking.duration);
    });
  });
}

function isNaturallyBusy(dateValue, time, duration) {
  const { hour, minute } = parseSlotTime(time);
  const dateNumber = Number(dateValue.replaceAll("-", ""));
  const seed = dateNumber + hour * 13 + minute + Number(duration);
  const peak = hour >= 17 && hour <= 21;
  return seed % (peak ? 4 : 7) === 0;
}

function slotPeriod(hour) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function generateSlots(dateValue = dateInput.value) {
  const slots = [];
  for (let hour = openingHour(dateValue); hour <= 22; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 22 && minute === 30) continue;
      slots.push({
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        period: slotPeriod(hour)
      });
    }
  }
  return slots;
}

function fitsOpeningHours(dateValue, time, duration) {
  const start = minutesFromTime(time);
  return start >= openingHour(dateValue) * 60 && start + Number(duration) <= 23 * 60;
}

function isPastSlot(dateValue, time) {
  const today = isoToday();
  if (dateValue < today) return true;
  if (dateValue > today) return false;
  const now = new Date();
  return minutesFromTime(time) <= now.getHours() * 60 + now.getMinutes();
}

function hasEnoughCourts(dateValue, time, duration, courtCount = selectedCourtCount()) {
  return availableCourtsFor(dateValue, time, duration).length >= courtCount;
}

function maxBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14); // bookings open 2 weeks ahead
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function isSlotAvailable(dateValue, time, duration, courtCount = selectedCourtCount()) {
  return fitsOpeningHours(dateValue, time, duration)
    && !isPastSlot(dateValue, time)
    && hasEnoughCourts(dateValue, time, duration, courtCount);
}

function dayStatus(dateValue) {
  const today = isoToday();
  if (dateValue < today || dateValue > maxBookingDate()) return "closed";
  const duration = durationInput.value;
  const needed = selectedCourtCount();
  const anyAvailable = generateSlots(dateValue).some((slot) => {
    return isSlotAvailable(dateValue, slot.time, duration, needed);
  });
  return anyAvailable ? "available" : "unavailable";
}

function syncVisibleMonthToDate() {
  const [year, month] = dateInput.value.split("-").map(Number);
  visibleMonth = new Date(year, month - 1, 1);
}

function renderCalendar() {
  calendarMonth.textContent = monthLabel(visibleMonth);
  calendarGrid.innerHTML = "";

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < startOffset; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = dayStatus(dateValue);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day ${status}`;
    button.textContent = day;
    button.dataset.date = dateValue;
    button.disabled = status === "closed";
    button.classList.toggle("selected", dateValue === dateInput.value);
    button.addEventListener("click", () => {
      dateInput.value = dateValue;
      selectedSlot = null;
      updateSummary();
      renderCalendar();
      renderSlots();
      updateProgress(1);
    });
    calendarGrid.append(button);
  }
}

function renderSlots() {
  const dateValue = dateInput.value;
  const duration = durationInput.value;
  const courtCount = selectedCourtCount();
  const slots = generateSlots(dateValue)
    .filter((slot) => slotFilter === "all" || slot.period === slotFilter)
    .filter((slot) => isSlotAvailable(dateValue, slot.time, duration, courtCount));
  selectedDateLabel.textContent = formatDateLabel(dateValue);
  slotList.innerHTML = "";

  if (!slots.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-slots";
    emptyState.textContent = t("No start times are available in this period. Try another time of day or date.");
    slotList.append(emptyState);
    return;
  }

  // Gap-minimising guidance: flag times that pack cleanly vs. ones that would
  // leave a short (unsellable) gap. We steer harder the further out the date is,
  // and always in peak hours; close to the date we just let people fill courts.
  const bookings = readBookings();
  const steer = window.MWBC_SCHEDULER ? window.MWBC_SCHEDULER.steerWeight(dateValue, isoToday()) : 0;
  const evals = slots.map((slot) => window.MWBC_SCHEDULER
    ? window.MWBC_SCHEDULER.evaluate(bookings, dateValue, slot.time, duration, courtCount)
    : { clean: true, peak: false });
  const anyGap = evals.some((e) => !e.clean);
  const markGaps = anyGap && evals.some((e) => !e.clean && (steer >= 0.34 || e.peak));

  if (anyGap) {
    const legend = document.createElement("p");
    legend.className = "slot-legend";
    legend.innerHTML = `<span class="rec">✓ ${t("Best fit")}</span>`;
    slotList.append(legend);
  }

  slots.forEach((slot, index) => {
    const ev = evals[index];
    const recommended = anyGap && ev.clean;
    const leavesGap = markGaps && !ev.clean;
    const { hour, minute } = parseSlotTime(slot.time);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot-button calendar-slot-button"
      + (recommended ? " slot-clean" : "")
      + (leavesGap ? " slot-gap" : "");
    button.dataset.time = slot.time;
    button.innerHTML = `<strong>${displayTime(hour, minute)}</strong>`
      + (recommended ? `<span class="slot-flag rec" aria-hidden="true">✓</span>`
        : leavesGap ? `<span class="slot-flag gap" aria-hidden="true">•</span>` : "");
    const base = isChinese() ? `选择${displayTime(hour, minute)}` : `Select ${displayTime(hour, minute)}`;
    button.setAttribute("aria-label", recommended ? `${base} — ${t("best fit")}`
      : leavesGap ? `${base} — ${t("leaves a short gap")}` : base);
    if (selectedSlot?.time === slot.time) button.classList.add("selected");
    button.addEventListener("click", () => selectSlot(slot.time));
    slotList.append(button);
  });
}

function selectSlot(time) {
  const dateValue = dateInput.value;
  const duration = durationInput.value;
  const courtCount = selectedCourtCount();
  const courtsForSlot = window.MWBC_SCHEDULER
    ? window.MWBC_SCHEDULER.allocate(readBookings(), dateValue, time, duration, courtCount)
    : availableCourtsFor(dateValue, time, duration).slice(0, courtCount);
  if (courtsForSlot.length < courtCount) return;
  selectedSlot = {
    date: dateValue,
    time,
    duration,
    court: courtsForSlot[0],
    courts: courtsForSlot,
    courtCount,
    price: computePrice(dateValue, time, duration, courtCount)
  };
  updateSummary();
  renderSlots();
  updateProgress(2);
}

function updateSubmitState() {
  submitButton.disabled = !(selectedSlot && policyInput.checked);
}

function updatePolicyCopy() {
  policyCopy.textContent = t("I agree to the booking change and cancellation policy.");
}

function updateSummary() {
  const courtCount = selectedSlot?.courtCount || selectedCourtCount();
  summaryCancellation.textContent = formatCancellationNotice(cancellationHours(dateInput.value, courtCount));
  updatePolicyCopy();

  if (!selectedSlot) {
    summarySelection.textContent = t("Pick an available time");
    summaryPrice.textContent = "$0";
    updateProgress(1);
    updateSubmitState();
    return;
  }

  summarySelection.textContent = isChinese()
    ? `${formatDateLabel(selectedSlot.date)}，${displayTimeValue(selectedSlot.time)}，${formatDuration(selectedSlot.duration)}，${selectedSlot.courtCount} 片场地`
    : `${formatDateLabel(selectedSlot.date)}, ${displayTimeValue(selectedSlot.time)}, ${formatDuration(selectedSlot.duration)}, ${selectedSlot.courtCount} ${selectedSlot.courtCount === 1 ? "court" : "courts"}`;
  summaryPrice.textContent = `$${selectedSlot.price}`;
  updateSubmitState();
}

function populateConfirmation(booking) {
  lastConfirmedBooking = booking;
  confirmationId.textContent = booking.id;
  confirmationDate.textContent = formatDateLabel(booking.date);
  confirmationTime.textContent = displayTimeValue(booking.time);
  confirmationDuration.textContent = formatDuration(booking.duration);
  confirmationCourts.textContent = isChinese()
    ? `${booking.courtCount} 片场地（系统自动分配）`
    : `${booking.courtCount} ${booking.courtCount === 1 ? "court" : "courts"}, assigned automatically`;
  confirmationTotal.textContent = `$${booking.price}`;
  confirmationCancellation.textContent = formatCancellationNotice(booking.cancellationHours);
  confirmationEmail.textContent = booking.email;
}

function updateProgress(activeIndex) {
  progressItems.forEach((item, index) => {
    item.classList.toggle("active", index <= activeIndex);
  });
}

function resetSelection() {
  selectedSlot = null;
  syncVisibleMonthToDate();
  updateSummary();
  renderCalendar();
  renderSlots();
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      slotFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderSlots();
    });
  });
}

function bindBookingForm() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedSlot) {
      formNote.textContent = t("Choose an available time to continue.");
      updateProgress(1);
      return;
    }
    if (!policyInput.checked) {
      formNote.textContent = t("Please agree to the booking change and cancellation policy before booking.");
      return;
    }
    if (!form.reportValidity()) return;

    const booking = {
      id: `MWBC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: document.querySelector("#customer-name").value.trim(),
      email: document.querySelector("#customer-email").value.trim(),
      phone: document.querySelector("#customer-phone").value.trim(),
      status: "Paid",
      source: "Online",
      cancellationHours: cancellationHours(selectedSlot.date, selectedSlot.courtCount),
      createdAt: new Date().toISOString(),
      ...selectedSlot
    };

    writeBookings([booking, ...readBookings()]);
    window.dispatchEvent(new CustomEvent("mwbc-bookings-updated"));
    window.refreshAdminSchedule?.();
    populateConfirmation(booking);
    formNote.textContent = "";
    updateProgress(3);
    form.reset();
    dateInput.value = isoToday();
    syncVisibleMonthToDate();
    selectedSlot = null;
    updateSummary();
    renderCalendar();
    renderSlots();
    window.showTab?.("booking-confirmation");
  });
}

dateInput.min = isoToday();
dateInput.max = maxBookingDate();
dateInput.value = isoToday();
syncVisibleMonthToDate();

document.querySelector("#calendar-prev").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#calendar-next").addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

dateInput.addEventListener("change", resetSelection);
durationInput.addEventListener("change", resetSelection);
courtCountInput.addEventListener("change", resetSelection);
policyInput.addEventListener("change", updateSubmitState);
window.addEventListener("mwbc-language-changed", () => {
  renderCalendar();
  renderSlots();
  updateSummary();
  if (lastConfirmedBooking) populateConfirmation(lastConfirmedBooking);
});

renderCalendar();
renderSlots();
updateSummary();
bindFilters();
bindBookingForm();

// Read-only availability lookup for the homepage hero strip.
window.MWBC_AVAILABILITY = {
  next(count = 3) {
    const today = isoToday();
    const tomorrow = (() => {
      const date = new Date(`${today}T12:00:00`);
      date.setDate(date.getDate() + 1);
      return date.toISOString().slice(0, 10);
    })();

    for (const [dateValue, isToday] of [[today, true], [tomorrow, false]]) {
      const times = generateSlots(dateValue)
        .filter((slot) => isSlotAvailable(dateValue, slot.time, 60, 1))
        .slice(0, count)
        .map((slot) => displayTimeValue(slot.time));
      if (times.length) return { isToday, times };
    }
    return null;
  }
};
})();
