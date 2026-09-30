const openingScreen = document.querySelector("#opening-screen");
const openButton = document.querySelector("#open-invitation");
const invitation = document.querySelector("#invitation");
const music = document.querySelector("#background-music");
const musicControl = document.querySelector("#music-control");
const musicLabel = document.querySelector("#music-label");
const rsvpForm = document.querySelector("#rsvp-form");
const successMessage = document.querySelector("#success-message");
const guestNamesWrap = document.querySelector("#guest-names-wrap");
const guestNames = document.querySelector("#guest-names");
const attendanceOptions = document.querySelectorAll('input[name="Attending"]');

let invitationOpened = false;

function updateMusicButton(isPlaying) {
  musicControl.classList.toggle("playing", isPlaying);
  musicControl.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
  musicLabel.textContent = isPlaying ? "Music On" : "Music Off";
  musicControl.querySelector(".music-icon").textContent = isPlaying ? "♪" : "↻";
}

async function startMusic() {
  try {
    music.volume = 0.36;
    await music.play();
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

function openInvitation() {
  if (invitationOpened) return;
  invitationOpened = true;
  openingScreen.classList.add("opening");
  invitation.removeAttribute("aria-hidden");
  document.body.classList.remove("locked");
  startMusic();

  window.setTimeout(() => {
    openingScreen.hidden = true;
    invitation.querySelector("a, button")?.focus({ preventScroll: true });
  }, 850);
}

openButton.addEventListener("click", openInvitation);

musicControl.addEventListener("click", async () => {
  if (music.paused) {
    await startMusic();
  } else {
    music.pause();
    updateMusicButton(false);
  }
});

music.addEventListener("pause", () => updateMusicButton(false));
music.addEventListener("play", () => updateMusicButton(true));

attendanceOptions.forEach((option) => {
  option.addEventListener("change", () => {
    const attending = option.value.startsWith("Yes") && option.checked;
    guestNamesWrap.hidden = !attending;
    guestNames.required = attending;
    if (!attending) guestNames.value = "";
  });
});

const errorMessage = document.querySelector("#rsvp-error");
const submitButton = rsvpForm.querySelector('button[type="submit"]');
let rsvpSending = false;

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (rsvpSending || !rsvpForm.reportValidity()) return;

  errorMessage.hidden = true;
  const endpoint = rsvpForm.dataset.formspreeEndpoint;
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint || "")) {
    errorMessage.textContent = "Online RSVPs are temporarily unavailable. Please use the email link below to send Steven your RSVP.";
    errorMessage.hidden = false;
    errorMessage.focus();
    return;
  }

  const data = new FormData(rsvpForm);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const originalLabel = submitButton.textContent;
  rsvpSending = true;
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  rsvpForm.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      errorMessage.textContent = response.status === 429
        ? "Too many RSVPs are being sent right now. Please wait a minute and try again, or email Steven below."
        : "Your RSVP was not confirmed. Please try again in a few minutes or email Steven below.";
      errorMessage.hidden = false;
      errorMessage.focus();
      return;
    }
    rsvpForm.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  } catch {
    errorMessage.textContent = "We could not confirm your RSVP. Your details are still here. Please contact Steven using the email link below to check before resending.";
    errorMessage.hidden = false;
    errorMessage.focus();
  } finally {
    window.clearTimeout(timeout);
    rsvpSending = false;
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
    rsvpForm.removeAttribute("aria-busy");
  }
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
