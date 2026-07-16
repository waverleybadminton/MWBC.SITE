const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#site-menu");
const tabLinks = Array.from(document.querySelectorAll("[data-tab-link]"));
const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
const contactForm = document.querySelector("#contact-form");
const contactFormNote = document.querySelector("#contact-form-note");
const t = (key, variables) => window.MWBC_I18N?.t(key, variables) || key;

function showTab(tabName, options = {}) {
  const aliases = {
    booking: "court-hire",
    pricing: "court-hire",
    facilities: "about",
    centre: "about",
    groups: "groups-schools",
    coaching: "groups-schools",
    policy: "court-hire",
    top: "home"
  };
  const requestedTab = aliases[tabName] || tabName;
  const nextTab = tabPanels.some((panel) => panel.dataset.tabPanel === requestedTab) ? requestedTab : "home";

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === nextTab);
  });

  tabLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.tabLink === nextTab);
  });

  document.body.classList.toggle("confirmation-active", nextTab === "booking-confirmation");
  document.body.classList.toggle("admin-active", nextTab === "admin");
  document.body.classList.toggle("home-active", nextTab === "home");
  document.body.classList.toggle("groups-active", nextTab === "groups-schools");

  if (!options.skipHash) {
    history.replaceState(null, "", `#${nextTab}`);
  }

  if (!options.keepScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.dispatchEvent(new CustomEvent("mwbc-tab-change", { detail: { tab: nextTab } }));
  if (nextTab === "admin") {
    window.refreshAdminSchedule?.();
  }
}

window.showTab = showTab;

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  contactFormNote.textContent = t("Thanks. Your enquiry has been received and the MWBC team will be in touch.");
  contactForm.reset();
});

tabLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showTab(link.dataset.tabLink);
    navLinks?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("hashchange", () => {
  showTab(location.hash.replace("#", ""), { skipHash: true, keepScroll: true });
});

showTab(location.hash.replace("#", ""), { skipHash: true, keepScroll: true });

// Subtle scroll reveals; instantly visible without IntersectionObserver or
// when the user prefers reduced motion.
const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("revealed"));
}

// Live availability strip in the hero. app.js (loaded after this file)
// exposes window.MWBC_AVAILABILITY; render on the next task so it exists.
function renderAvailabilityStrip() {
  const slotsEl = document.querySelector("#avail-slots");
  const labelEl = document.querySelector("#avail-label");
  if (!slotsEl || !labelEl || !window.MWBC_AVAILABILITY) return;

  const next = window.MWBC_AVAILABILITY.next(3);
  slotsEl.innerHTML = "";

  if (!next) {
    labelEl.textContent = t("Next courts");
    return;
  }

  labelEl.textContent = next.isToday ? t("Today") : t("Tomorrow");
  next.times.forEach((label) => {
    const slot = document.createElement("a");
    slot.className = "avail-slot";
    slot.href = "#court-hire";
    slot.textContent = label;
    slot.addEventListener("click", (event) => {
      event.preventDefault();
      showTab("court-hire");
    });
    slotsEl.append(slot);
  });
}

setTimeout(renderAvailabilityStrip, 0);
window.addEventListener("mwbc-language-changed", renderAvailabilityStrip);
window.addEventListener("mwbc-bookings-updated", renderAvailabilityStrip);
