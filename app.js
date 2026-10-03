// Prank Safe — version pro
// Ce script génère des effets sonores, animations et interactions sans dépendre d'un fichier audio externe.

let audioContext = null;
let lastToneTime = 0;

function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }
  return audioContext;
}

function unlockAudio() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

function tone({ frequency = 440, duration = 180, type = "sine", volume = 0.08, sweep = 0, delay = 0 } = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  if (sweep !== 0) {
    oscillator.frequency.linearRampToValueAtTime(frequency + sweep, ctx.currentTime + delay + duration / 1000);
  }

  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration / 1000);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration / 1000 + 0.02);
}

function noiseBurst({ duration = 120, volume = 0.04, highpass = 500 } = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const buffer = ctx.createBuffer(1, ctx.sampleRate * (duration / 1000), ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  filter.type = "highpass";
  filter.frequency.value = highpass;
  gain.gain.value = volume;

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
  source.stop(ctx.currentTime + duration / 1000 + 0.02);
}

function playSequence(sequence) {
  sequence.forEach((step, index) => {
    const timeout = (step.delay || 0) + (index > 0 ? sequence[index - 1].duration || 0 : 0);
    setTimeout(() => {
      if (step.type === "noise") {
        noiseBurst({ duration: step.duration || 120, volume: step.volume || 0.04, highpass: step.highpass || 600 });
      } else {
        tone({
          frequency: step.frequency || 440,
          duration: step.duration || 180,
          type: step.type || "sine",
          volume: step.volume || 0.08,
          sweep: step.sweep || 0,
          delay: step.delay || 0
        });
      }
    }, timeout);
  });
}

function soundFor(name) {
  const now = performance.now();
  if (now - lastToneTime < 80) return;
  lastToneTime = now;

  switch (name) {
    case "beep":
      tone({ frequency: 880, duration: 120, type: "sine", volume: 0.08 });
      break;

    case "error":
      playSequence([
        { frequency: 420, duration: 80, type: "square", volume: 0.09 },
        { frequency: 280, duration: 90, type: "square", volume: 0.09, delay: 120 }
      ]);
      break;

    case "ping":
      playSequence([
        { frequency: 1100, duration: 90, type: "triangle", volume: 0.08 },
        { frequency: 1500, duration: 60, type: "triangle", volume: 0.07, delay: 90 }
      ]);
      break;

    case "laugh":
      playSequence([
        { frequency: 540, duration: 160, type: "sine", volume: 0.06 },
        { frequency: 620, duration: 120, type: "sine", volume: 0.06, delay: 140 },
        { frequency: 700, duration: 140, type: "sine", volume: 0.06, delay: 260 }
      ]);
      break;

    case "win":
      playSequence([
        { frequency: 523, duration: 180, type: "sine", volume: 0.09 },
        { frequency: 659, duration: 180, type: "sine", volume: 0.09, delay: 180 },
        { frequency: 784, duration: 260, type: "sine", volume: 0.09, delay: 360 }
      ]);
      break;

    case "drop":
      playSequence([
        { frequency: 900, duration: 80, type: "sine", volume: 0.08 },
        { frequency: 720, duration: 80, type: "sine", volume: 0.08, delay: 90 },
        { frequency: 540, duration: 80, type: "sine", volume: 0.08, delay: 180 },
        { frequency: 360, duration: 120, type: "sine", volume: 0.07, delay: 260 }
      ]);
      break;

    default:
      tone({ frequency: 440, duration: 100, type: "sine", volume: 0.08 });
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
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

  noiseBurst({ duration: 220, volume: 0.02, highpass: 3000 });

  setTimeout(() => {
    screen.style.display = "none";
    screen.setAttribute("aria-hidden", "true");
  }, 2600);
}

function addAlertToList(label = "Fausse alerte") {
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

  const closeBtn = item.querySelector(".alert-close");
  closeBtn.addEventListener("click", () => item.remove());

  list.prepend(item);
  showToast("📢 Alerte ajoutée");
}

function randomJoke() {
  const jokes = [
    "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau !",
    "Quelle est la plus grande force d'un ordinateur ? Sa mémoire !",
    "Qu'est-ce qu'un hamster dans un jardin ? Un petit jardinier !",
    "Quel animal est le meilleur en informatique ? Le raton-laveur, il sait gérer les fichiers !",
    "Pourquoi les développeurs aiment-ils le café ? Parce qu'il les aide à compiler leurs idées."
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  alert("😂 Blague du jour\n\n" + joke);
  showToast("😂 Blague affichée");
}

function incrementScore(delta = 5) {
  const scoreEl = document.getElementById("score");
  if (!scoreEl) return;
  const current = Number(scoreEl.textContent || 0);
  scoreEl.textContent = String(current + delta);
}

function handleAction(action) {
  unlockAudio();

  switch (action) {
    case "notification":
      addAlertToList();
      soundFor("ping");
      incrementScore(5);
      break;

    case "crash":
      showFakeScreen();
      soundFor("error");
      incrementScore(3);
      break;

    case "joke":
      randomJoke();
      soundFor("laugh");
      incrementScore(7);
      break;

    case "sound":
      showOverlay();
      soundFor("beep");
      incrementScore(2);
      break;

    default:
      break;
  }
}

function bindEvents() {
  document.querySelectorAll(".sound-btn").forEach((button) => {
    button.addEventListener("click", () => {
      unlockAudio();
      const toneName = button.dataset.tone;
      soundFor(toneName);
      showToast(`🔊 ${button.textContent}`);
      incrementScore(1);
    });
  });

  document.querySelectorAll(".action-card").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      handleAction(action);
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

  const addAlertBtn = document.getElementById("add-alert");
  if (addAlertBtn) {
    addAlertBtn.addEventListener("click", () => {
      addAlertToList("Alerte manuelle");
      soundFor("ping");
      incrementScore(4);
    });
  }

  const closeOverlayBtn = document.getElementById("close-overlay");
  if (closeOverlayBtn) {
    closeOverlayBtn.addEventListener("click", () => {
      hideOverlay();
      soundFor("beep");
    });
  }

  const confirmOverlayBtn = document.getElementById("confirm-overlay");
  if (confirmOverlayBtn) {
    confirmOverlayBtn.addEventListener("click", () => {
      hideOverlay();
      soundFor("win");
      showToast("✅ Confirmé");
      incrementScore(10);
    });
  }
}

function init() {
  bindEvents();

  const overlay = document.getElementById("overlay");
  if (overlay) hideOverlay();

  const fakeScreen = document.getElementById("fake-screen");
  if (fakeScreen) {
    fakeScreen.style.display = "none";
    fakeScreen.setAttribute("aria-hidden", "true");
  }

  const toast = document.getElementById("toast");
  if (toast) toast.classList.remove("show");
}

window.addEventListener("DOMContentLoaded", init);
