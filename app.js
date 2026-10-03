// ============================================================
// PRANK SAFE — ULTRA PREMIUM EDITION
// Sons réalistes, crash system, audio externes, effets précis
// ============================================================

const AUDIO_FILES = {
  beep: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  ping: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  error: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  laugh: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  win: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  drop: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  crash: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
  notification: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
};

let audioContext = null;
let audioCache = {};
let lastSoundTime = 0;

// ============================================================
// AUDIO CONTEXT MANAGEMENT
// ============================================================

function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      console.warn("Web Audio API not supported");
      return null;
    }
    audioContext = new AudioCtor();
  }
  return audioContext;
}

function unlockAudio() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// ============================================================
// TONE SYNTHESIS (FALLBACK)
// ============================================================

function createOscillator({
  frequency = 440,
  duration = 180,
  type = "sine",
  volume = 0.08,
  delay = 0,
  sweep = 0,
  attack = 0.02,
  release = 0.05
} = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + (delay || 0);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (sweep !== 0) {
    oscillator.frequency.linearRampToValueAtTime(
      frequency + sweep,
      now + duration / 1000
    );
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + duration / 1000);

  filter.type = "lowpass";
  filter.frequency.value = 5000;

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration / 1000 + release);
}

// ============================================================
// NOISE SYNTHESIS
// ============================================================

function createNoise({
  duration = 120,
  volume = 0.04,
  highpass = 800,
  lowpass = 5000,
  type = "white",
  decay = true
} = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const bufferLength = ctx.sampleRate * (duration / 1000);
  const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate noise
  if (type === "white") {
    for (let i = 0; i < bufferLength; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (type === "brown") {
    let brownian = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      brownian = (brownian + white * 0.04) * 0.98;
      data[i] = brownian;
    }
  } else if (type === "pink") {
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.049922035 * white + 0.950377974 * b0;
      b1 = 0.362034334 * white + 0.637965666 * b1;
      b2 = 0.214318673 * white + 0.785681327 * b2;
      b3 = 0.06522164 * white + 0.93477836 * b3;
      b4 = 0.002612041 * white + 0.997387959 * b4;
      b5 = 0.556574766 * white + 0.443425234 * b5;
      b6 = 0.641853226 * white + 0.358146774 * b6;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6;
    }
  }

  // Apply envelope
  if (decay) {
    for (let i = 0; i < bufferLength; i++) {
      const progress = i / bufferLength;
      const envelope = Math.pow(1 - progress, 1.2);
      data[i] *= envelope;
    }
  }

  const source = ctx.createBufferSource();
  const hpFilter = ctx.createBiquadFilter();
  const lpFilter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  hpFilter.type = "highpass";
  hpFilter.frequency.value = highpass;

  lpFilter.type = "lowpass";
  lpFilter.frequency.value = lowpass;

  gain.gain.value = volume;

  source.buffer = buffer;
  source.connect(hpFilter);
  hpFilter.connect(lpFilter);
  lpFilter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
  source.stop(ctx.currentTime + duration / 1000);
}

// ============================================================
// PLAYABLE SEQUENCES
// ============================================================

function playSequence(sequence) {
  let cumulativeDelay = 0;

  sequence.forEach((step) => {
    setTimeout(() => {
      if (step.noise) {
        createNoise({
          duration: step.duration || 120,
          volume: step.volume || 0.04,
          highpass: step.highpass || 600,
          lowpass: step.lowpass || 5000,
          type: step.noiseType || "white",
          decay: step.decay !== false
        });
      } else {
        createOscillator({
          frequency: step.frequency || 440,
          duration: step.duration || 180,
          type: step.type || "sine",
          volume: step.volume || 0.08,
          sweep: step.sweep || 0,
          attack: step.attack || 0.02,
          release: step.release || 0.05
        });
      }
    }, cumulativeDelay);

    cumulativeDelay += (step.duration || 180) + (step.gap || 0);
  });
}

// ============================================================
// PREMIUM SOUND EFFECTS — EACH BUTTON HAS UNIQUE AUDIO
// ============================================================

function soundFor(name) {
  if (performance.now() - lastSoundTime < 50) return;
  lastSoundTime = performance.now();

  unlockAudio();

  switch (name) {
    // SOUNDBOARD: Beep
    case "beep":
      playSequence([
        { frequency: 880, duration: 120, type: "sine", volume: 0.09, attack: 0.01, release: 0.04 }
      ]);
      break;

    // SOUNDBOARD: Error
    case "error":
      playSequence([
        { frequency: 420, duration: 100, type: "square", volume: 0.1, attack: 0.005, release: 0.08 },
        { frequency: 280, duration: 120, type: "square", volume: 0.1, gap: 80, attack: 0.005, release: 0.08 }
      ]);
      break;

    // SOUNDBOARD: Ping
    case "ping":
      playSequence([
        { frequency: 1200, duration: 80, type: "triangle", volume: 0.08, attack: 0.01, release: 0.03 },
        { frequency: 1500, duration: 60, type: "triangle", volume: 0.07, gap: 100, attack: 0.01, release: 0.02 }
      ]);
      break;

    // SOUNDBOARD: Laugh
    case "laugh":
      playSequence([
        { frequency: 540, duration: 180, type: "sine", volume: 0.07, attack: 0.02, release: 0.05 },
        { frequency: 620, duration: 140, type: "sine", volume: 0.07, gap: 150, attack: 0.02, release: 0.04 },
        { frequency: 700, duration: 160, type: "sine", volume: 0.07, gap: 280, attack: 0.02, release: 0.06 }
      ]);
      break;

    // SOUNDBOARD: Win / Success
    case "win":
      playSequence([
        { frequency: 523, duration: 180, type: "sine", volume: 0.09, attack: 0.01, release: 0.04 },
        { frequency: 659, duration: 180, type: "sine", volume: 0.09, gap: 150, attack: 0.01, release: 0.04 },
        { frequency: 784, duration: 280, type: "sine", volume: 0.1, gap: 150, attack: 0.02, release: 0.08 }
      ]);
      break;

    // SOUNDBOARD: Drop
    case "drop":
      playSequence([
        { frequency: 900, duration: 80, type: "sine", volume: 0.09, attack: 0.005, release: 0.03, sweep: -300 },
        { frequency: 720, duration: 80, type: "sine", volume: 0.08, gap: 60, attack: 0.005, release: 0.03, sweep: -250 },
        { frequency: 540, duration: 80, type: "sine", volume: 0.08, gap: 60, attack: 0.005, release: 0.03, sweep: -200 },
        { frequency: 360, duration: 120, type: "sine", volume: 0.07, gap: 60, attack: 0.01, release: 0.04, sweep: -150 }
      ]);
      break;

    // ACTION CARD: Notification (unique sound)
    case "notification":
      playSequence([
        { noise: true, noiseType: "white", duration: 40, volume: 0.03, highpass: 4000, lowpass: 6000, decay: false },
        { frequency: 1100, duration: 70, type: "triangle", volume: 0.08, gap: 50, attack: 0.01, release: 0.03 },
        { frequency: 1300, duration: 60, type: "triangle", volume: 0.07, gap: 80, attack: 0.01, release: 0.02 }
      ]);
      break;

    // ACTION CARD: Crash (FAKE SYSTEM CRASH SOUND)
    case "crash":
      playSequence([
        { noise: true, noiseType: "brown", duration: 150, volume: 0.08, highpass: 300, lowpass: 8000, decay: true },
        { frequency: 200, duration: 100, type: "square", volume: 0.08, gap: 80, attack: 0.01, release: 0.05, sweep: -100 },
        { noise: true, noiseType: "pink", duration: 120, volume: 0.06, highpass: 500, lowpass: 7000, gap: 120, decay: true },
        { frequency: 150, duration: 80, type: "square", volume: 0.07, gap: 100, attack: 0.01, release: 0.04 }
      ]);
      break;

    // ACTION CARD: Joke (playful laugh sequence)
    case "joke":
      playSequence([
        { frequency: 520, duration: 150, type: "sine", volume: 0.06, attack: 0.03, release: 0.04 },
        { frequency: 600, duration: 130, type: "sine", volume: 0.07, gap: 160, attack: 0.03, release: 0.03 },
        { frequency: 680, duration: 140, type: "sine", volume: 0.06, gap: 200, attack: 0.03, release: 0.05 }
      ]);
      break;

    // ACTION CARD: Sound (system notification tone)
    case "sound":
      playSequence([
        { frequency: 950, duration: 90, type: "sine", volume: 0.09, attack: 0.01, release: 0.03 },
        { frequency: 1200, duration: 70, type: "sine", volume: 0.08, gap: 110, attack: 0.01, release: 0.02 }
      ]);
      break;

    default:
      createOscillator({ frequency: 440, duration: 100, type: "sine", volume: 0.08 });
  }
}

// ============================================================
// UI HELPERS
// ============================================================

function showToast(message, duration = 1800) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function showOverlay() {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}

function hideOverlay() {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

function showFakeScreen() {
  const screen = document.getElementById("fake-screen");
  if (!screen) return;

  screen.style.display = "flex";
  screen.setAttribute("aria-hidden", "false");

  // Play crash noise during screen display
  createNoise({
    duration: 200,
    volume: 0.03,
    highpass: 2000,
    lowpass: 8000,
    type: "brown",
    decay: false
  });

  setTimeout(() => {
    screen.style.display = "none";
    screen.setAttribute("aria-hidden", "true");
  }, 3000);
}

function addAlertItem(label = "Fausse alerte") {
  const list = document.getElementById("notification-list");
  if (!list) return;

  const item = document.createElement("div");
  item.className = "alert-item";
  item.innerHTML = `
    <div class="alert-row">
      <div>
        <strong>${label}</strong>
        <small>${new Date().toLocaleTimeString("fr-FR")}</small>
      </div>
      <button type="button" class="alert-close" aria-label="Supprimer">✕</button>
    </div>
  `;

  item.querySelector(".alert-close").addEventListener("click", () => {
    item.remove();
    soundFor("beep");
  });

  list.prepend(item);
  showToast("📢 Alerte ajoutée");
}

function randomJoke() {
  const jokes = [
    "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau !",
    "Qu'est-ce qu'un hamster dans un jardin ? Un petit jardinier !",
    "Quel animal est le meilleur en informatique ? Le raton-laveur, il sait gérer les fichiers !",
    "Pourquoi les développeurs aiment-ils le café ? Parce qu'il aide à compiler les idées !",
    "Quel est le comble pour un électricien ? De ne pas être au courant !",
    "Comment appelle-t-on un canif ? Un petit fien !",
    "Qu'est-ce qu'un crocodile qui surveille la pharmacie ? Un Lacoste-guard !"
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  alert("😂 Blague du jour\n\n" + joke);
  showToast("😂 Blague affichée");
}

function updateScore(delta = 0) {
  const scoreEl = document.getElementById("score");
  if (!scoreEl) return;

  const current = Number(scoreEl.textContent || 0);
  const newScore = Math.max(0, current + delta);
  scoreEl.textContent = newScore;

  if (delta > 0) {
    scoreEl.parentElement.classList.add("score-pop");
    setTimeout(() => scoreEl.parentElement.classList.remove("score-pop"), 400);
  }
}

// ============================================================
// ACTION HANDLERS
// ============================================================

function handleAction(action) {
  unlockAudio();

  switch (action) {
    case "notification":
      addAlertItem("Notification système");
      soundFor("notification");
      updateScore(5);
      break;

    case "crash":
      showFakeScreen();
      soundFor("crash");
      updateScore(3);
      break;

    case "joke":
      randomJoke();
      soundFor("joke");
      updateScore(7);
      break;

    case "sound":
      showOverlay();
      soundFor("sound");
      updateScore(2);
      break;
  }
}

// ============================================================
// EVENT BINDING
// ============================================================

document.querySelectorAll(".sound-btn").forEach((button) => {
  button.addEventListener("click", () => {
    unlockAudio();
    const toneName = button.dataset.tone;
    soundFor(toneName);
    showToast(`🔊 ${button.textContent}`);
    updateScore(1);

    // Visual feedback
    button.classList.add("active");
    setTimeout(() => button.classList.remove("active"), 150);
  });
});

document.querySelectorAll(".action-card").forEach((button) => {
  button.addEventListener("click", () => {
    handleAction(button.dataset.action);

    // Visual feedback
    button.classList.add("active");
    setTimeout(() => button.classList.remove("active"), 200);
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((node) => node.classList.remove("active"));
    tab.classList.add("active");
    unlockAudio();
    soundFor("beep");
  });
});

const addAlertButton = document.getElementById("add-alert");
if (addAlertButton) {
  addAlertButton.addEventListener("click", () => {
    addAlertItem("Alerte manuelle");
    soundFor("notification");
    updateScore(4);
  });
}

const closeOverlayButton = document.getElementById("close-overlay");
if (closeOverlayButton) {
  closeOverlayButton.addEventListener("click", () => {
    hideOverlay();
    soundFor("beep");
  });
}

const confirmOverlayButton = document.getElementById("confirm-overlay");
if (confirmOverlayButton) {
  confirmOverlayButton.addEventListener("click", () => {
    hideOverlay();
    soundFor("win");
    showToast("✅ Confirmé");
    updateScore(10);
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  if (overlay) hideOverlay();

  const fakeScreen = document.getElementById("fake-screen");
  if (fakeScreen) {
    fakeScreen.style.display = "none";
    fakeScreen.setAttribute("aria-hidden", "true");
  }

  const toast = document.getElementById("toast");
  if (toast) toast.classList.remove("show");

  console.log("🎵 Prank Safe — Ultra Premium Edition loaded!");
});

// User interaction to unlock audio context
document.addEventListener("click", unlockAudio, { once: true });
