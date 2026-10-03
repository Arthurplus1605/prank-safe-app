// ============================================================
// PRANK SAFE — ULTRA PREMIUM EDITION
// ============================================================

const state = {
  actions: 0,
  sounds: 0,
  laughs: 0,
  alerts: 0,
  volume: 1,
  sessionStart: Date.now(),
  jokePool: [
    "Pourquoi les développeurs adorent les montagne russes ? Parce qu'ils aiment les boucles !",
    "Pourquoi les bases de données ne vont jamais au cinéma ? Parce qu'elles ont peur des requêtes !",
    "Que dit un programmeur quand il va au supermarché ? Je veux du code, du café et des cookies !",
    "Pourquoi les tests automatisés aiment-ils les vacances ? Parce qu'ils peuvent enfin se reposer !",
    "Comment appelle-t-on un développeur en vacances ? Un full stack relax !",
    "Pourquoi les bugs font-ils peur ? Parce qu'ils arrivent toujours au mauvais moment !",
    "Pourquoi les ordinateurs sont si calmes ? Parce qu'ils gardent toujours leur cool !",
    "Qu'est-ce qu'un pirate devenu développeur ? Un codeur avec un grand 'Arrr!'.",
    "Pourquoi les interfaces mobiles sont cool ? Parce qu'elles sont toujours à l'écoute !",
    "Qu'est-ce qu'un bug de nuit ? Une histoire qui se passe après minuit."
  ]
};

let audioContext = null;
let lastSoundTime = 0;

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
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

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
    oscillator.frequency.linearRampToValueAtTime(frequency + sweep, now + duration / 1000);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * state.volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + duration / 1000 + release);

  filter.type = "lowpass";
  filter.frequency.value = 5000;

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration / 1000 + release + 0.03);
}

function createNoise({ duration = 120, volume = 0.04, highpass = 800, lowpass = 5000, type = "white", decay = true } = {}) {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const bufferLength = ctx.sampleRate * (duration / 1000);
  const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < bufferLength; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "brown") {
    let brown = 0;
    for (let i = 0; i < bufferLength; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + white * 0.04) * 0.98;
      data[i] = brown;
    }
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
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

  if (decay) {
    for (let i = 0; i < bufferLength; i++) {
      const progress = i / bufferLength;
      data[i] *= Math.pow(1 - progress, 1.2);
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

  gain.gain.value = volume * state.volume;

  source.buffer = buffer;
  source.connect(hpFilter);
  hpFilter.connect(lpFilter);
  lpFilter.connect(gain);
  gain.connect(ctx.destination);

  source.start();
  source.stop(ctx.currentTime + duration / 1000 + 0.02);
}

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
          release: step.release || 0.05,
          delay: step.delay || 0
        });
      }
    }, cumulativeDelay);

    cumulativeDelay += (step.duration || 180) + (step.gap || 0);
  });
}

function soundFor(name) {
  if (performance.now() - lastSoundTime < 50) return;
  lastSoundTime = performance.now();
  unlockAudio();

  state.sounds += 1;
  updateStats();

  switch (name) {
    case "beep":
      playSequence([{ frequency: 820, duration: 120, type: "triangle", volume: 0.08 }]);
      break;

    case "error":
      playSequence([
        { frequency: 420, duration: 100, type: "square", volume: 0.1, attack: 0.01, release: 0.08 },
        { frequency: 280, duration: 110, type: "square", volume: 0.1, gap: 90, attack: 0.01, release: 0.08 }
      ]);
      break;

    case "ping":
      playSequence([
        { frequency: 1200, duration: 70, type: "triangle", volume: 0.08 },
        { frequency: 1500, duration: 60, type: "triangle", volume: 0.07, gap: 100 }
      ]);
      break;

    case "laugh":
      playSequence([
        { frequency: 540, duration: 170, type: "sine", volume: 0.06 },
        { frequency: 620, duration: 140, type: "sine", volume: 0.06, gap: 180 },
        { frequency: 700, duration: 160, type: "sine", volume: 0.06, gap: 260 }
      ]);
      break;

    case "win":
      playSequence([
        { frequency: 523, duration: 180, type: "sine", volume: 0.09 },
        { frequency: 659, duration: 180, type: "sine", volume: 0.09, gap: 160 },
        { frequency: 784, duration: 260, type: "sine", volume: 0.1, gap: 200 }
      ]);
      break;

    case "drop":
      playSequence([
        { frequency: 900, duration: 80, type: "sine", volume: 0.09, sweep: -300 },
        { frequency: 720, duration: 80, type: "sine", volume: 0.08, gap: 60, sweep: -220 },
        { frequency: 540, duration: 80, type: "sine", volume: 0.08, gap: 60, sweep: -180 },
        { frequency: 360, duration: 120, type: "sine", volume: 0.07, gap: 90, sweep: -140 }
      ]);
      break;

    case "notification":
      playSequence([
        { noise: true, noiseType: "white", duration: 50, volume: 0.03, highpass: 3500, lowpass: 6000, decay: false },
        { frequency: 1100, duration: 70, type: "triangle", volume: 0.08, gap: 50 },
        { frequency: 1300, duration: 60, type: "triangle", volume: 0.07, gap: 80 }
      ]);
      break;

    case "crash":
      playSequence([
        { noise: true, noiseType: "brown", duration: 150, volume: 0.08, highpass: 300, lowpass: 8000, decay: true },
        { frequency: 200, duration: 100, type: "square", volume: 0.08, gap: 80, sweep: -100 },
        { noise: true, noiseType: "pink", duration: 120, volume: 0.06, highpass: 500, lowpass: 7000, gap: 120, decay: true },
        { frequency: 150, duration: 80, type: "square", volume: 0.07, gap: 100 }
      ]);
      break;

    case "joke":
      playSequence([
        { frequency: 520, duration: 150, type: "sine", volume: 0.06 },
        { frequency: 600, duration: 130, type: "sine", volume: 0.07, gap: 160 },
        { frequency: 680, duration: 140, type: "sine", volume: 0.06, gap: 200 }
      ]);
      break;

    case "sound":
      playSequence([
        { frequency: 950, duration: 90, type: "sine", volume: 0.09 },
        { frequency: 1200, duration: 70, type: "sine", volume: 0.08, gap: 110 }
      ]);
      break;

    default:
      createOscillator({ frequency: 440, duration: 100, type: "sine", volume: 0.08 });
  }
}

function showToast(message, duration = 1800) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function showOverlay(id = "overlay") {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}

function hideOverlay(id = "overlay") {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

function showFakeScreen() {
  const screen = document.getElementById("fake-screen");
  if (!screen) return;
  screen.style.display = "flex";
  screen.setAttribute("aria-hidden", "false");
  createNoise({ duration: 200, volume: 0.03, highpass: 2000, lowpass: 8000, type: "brown", decay: false });
  setTimeout(() => {
    screen.style.display = "none";
    screen.setAttribute("aria-hidden", "true");
  }, 3000);
}

function addAlertItem(label = "Fausse alerte", detail = "Système de sécurité") {
  const list = document.getElementById("notification-list");
  if (!list) return;

  const item = document.createElement("div");
  item.className = "notification-item";
  item.innerHTML = `
    <span class="notification-dot"></span>
    <div class="notification-text">
      <strong>${label}</strong>
      <span>${detail} · ${new Date().toLocaleTimeString("fr-FR")}</span>
    </div>
  `;

  list.prepend(item);
  state.alerts += 1;
  updateStats();
  showToast("📢 Alerte ajoutée");
}

function randomJoke() {
  const joke = state.jokePool[Math.floor(Math.random() * state.jokePool.length)];
  const jokeModal = document.getElementById("joke-modal");
  const jokeContent = document.getElementById("joke-content");
  if (jokeModal && jokeContent) {
    jokeContent.textContent = joke;
    showOverlay("joke-modal");
  } else {
    alert("😂 " + joke);
  }
  state.laughs += 1;
  updateStats();
  showToast("😂 Blague affichée");
}

function updateScore(delta = 0) {
  const scoreEl = document.getElementById("score");
  if (!scoreEl) return;

  const current = Number(scoreEl.textContent || 0);
  const newScore = Math.max(0, current + delta);
  scoreEl.textContent = newScore;
  state.actions += delta > 0 ? 1 : 0;
  updateStats();

  if (delta > 0) {
    scoreEl.parentElement.classList.add("score-pop");
    setTimeout(() => scoreEl.parentElement.classList.remove("score-pop"), 420);
  }
}

function updateStats() {
  const actionEl = document.getElementById("stat-actions");
  const soundEl = document.getElementById("stat-sounds");
  const laughEl = document.getElementById("stat-laughs");
  const timeEl = document.getElementById("stat-time");

  const detailedActions = document.getElementById("detailed-actions");
  const detailedSounds = document.getElementById("detailed-sounds");
  const detailedAlerts = document.getElementById("detailed-alerts");
  const detailedTime = document.getElementById("detailed-time");

  if (actionEl) actionEl.textContent = String(state.actions);
  if (soundEl) soundEl.textContent = String(state.sounds);
  if (laughEl) laughEl.textContent = String(state.laughs);

  const elapsed = Math.floor((Date.now() - state.sessionStart) / 1000);
  if (timeEl) timeEl.textContent = `${elapsed}s`;

  if (detailedActions) detailedActions.textContent = String(state.actions);
  if (detailedSounds) detailedSounds.textContent = String(state.sounds);
  if (detailedAlerts) detailedAlerts.textContent = String(state.alerts);
  if (detailedTime) detailedTime.textContent = `${elapsed}s`;

  const funEl = document.getElementById("detailed-fun");
  if (funEl) {
    funEl.textContent = state.laughs > 5 ? "🔥" : state.laughs > 2 ? "😄" : "🙂";
  }
}

function resetStats() {
  state.actions = 0;
  state.sounds = 0;
  state.laughs = 0;
  state.alerts = 0;
  state.sessionStart = Date.now();
  document.getElementById("score").textContent = "12";
  updateStats();
  showToast("📊 Statistiques réinitialisées");
}

function handleAction(action) {
  unlockAudio();
  state.actions += 1;

  switch (action) {
    case "notification":
      addAlertItem("Notification système", "Fichier de sécurité détecté");
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

  updateStats();
}

function bindEvents() {
  document.querySelectorAll(".sound-btn").forEach((button) => {
    button.addEventListener("click", () => {
      unlockAudio();
      const toneName = button.dataset.tone;
      soundFor(toneName);
      showToast(`🔊 ${button.textContent}`);
      updateScore(1);
      button.classList.add("active");
      setTimeout(() => button.classList.remove("active"), 150);
    });
  });

  document.querySelectorAll(".action-card").forEach((button) => {
    button.addEventListener("click", () => {
      handleAction(button.dataset.action);
      button.classList.add("active");
      setTimeout(() => button.classList.remove("active"), 220);
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
      addAlertItem("Alerte manuelle", "Commande de test envoyée");
      soundFor("notification");
      updateScore(4);
    });
  }

  const randomJokeButton = document.getElementById("random-joke");
  if (randomJokeButton) {
    randomJokeButton.addEventListener("click", randomJoke);
  }

  const closeJokeButton = document.getElementById("close-joke");
  if (closeJokeButton) {
    closeJokeButton.addEventListener("click", () => hideOverlay("joke-modal"));
  }

  const anotherJokeButton = document.getElementById("another-joke");
  if (anotherJokeButton) {
    anotherJokeButton.addEventListener("click", randomJoke);
  }

  document.querySelectorAll(".joke-copy-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.parentElement.querySelector(".joke-text").textContent;
      navigator.clipboard?.writeText(text).catch(() => {});
      showToast("📋 Blague copiée");
      soundFor("beep");
    });
  });

  const loadMoreButton = document.getElementById("load-more-jokes");
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
      const jokesContainer = document.getElementById("jokes-container");
      if (!jokesContainer) return;
      const more = [
        "Quel est le repas préféré d'un programmeur ? Des bugs au chocolat.",
        "Pourquoi les tests logiciels sont si prudents ? Parce qu'ils ne veulent pas réveiller les bugs.",
        "Pourquoi les développeurs aiment-ils les nuits noires ? Parce qu'ils aiment voir les erreurs clignoter.",
        "Pourquoi un bon développeur porte-t-il toujours une pomme ? Pour réparer les bugs du cœur."
      ];
      more.forEach((text) => {
        const item = document.createElement("div");
        item.className = "joke-item";
        item.innerHTML = `
          <p class="joke-text">${text}</p>
          <button class="joke-copy-btn">📋 Copier</button>
        `;
        item.querySelector(".joke-copy-btn").addEventListener("click", () => {
          navigator.clipboard?.writeText(text).catch(() => {});
          showToast("📋 Blague copiée");
          soundFor("beep");
        });
        jokesContainer.appendChild(item);
      });
      loadMoreButton.textContent = "Plus de blagues !";
      soundFor("laugh");
    });
  }

  document.querySelectorAll(".quick-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      const messages = {
        security: ["Alerte de sécurité", "Vérification du pare-feu active"],
        battery: ["Batterie faible", "Recharge du module système nécessaire"],
        network: ["Réseau modifié", "Connexion sécurisée détectée"],
        update: ["Mise à jour disponible", "Module anti-prank en cours de synchronisation"]
      };
      const [title, detail] = messages[preset] || messages.security;
      addAlertItem(title, detail);
      soundFor("notification");
    });
  });

  document.querySelectorAll(".preset-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      const sounds = {
        "alert-sequence": ["notification", "error"],
        "success-sequence": ["win", "beep"],
        "error-sequence": ["crash", "error"],
        "notification-sequence": ["ping", "notification"]
      };
      const sequence = sounds[preset] || ["beep"];
      sequence.forEach((tone, index) => setTimeout(() => soundFor(tone), index * 160));
      showToast("🎵 Séquence lancée");
    });
  });

  const volumeButton = document.getElementById("volume-control");
  if (volumeButton) {
    volumeButton.addEventListener("click", () => {
      state.volume = state.volume === 1 ? 0.2 : 1;
      volumeButton.textContent = state.volume === 1 ? "🔊 Vol" : "🔇 Vol";
      soundFor("beep");
      showToast(state.volume === 1 ? "Volume activé" : "Volume réduit");
    });
  }

  const statsButton = document.getElementById("score");
  if (statsButton) {
    statsButton.addEventListener("click", () => showOverlay("stats-modal"));
  }

  const closeStatsButton = document.getElementById("close-stats");
  if (closeStatsButton) {
    closeStatsButton.addEventListener("click", () => hideOverlay("stats-modal"));
  }

  const resetStatsButton = document.getElementById("reset-stats");
  if (resetStatsButton) {
    resetStatsButton.addEventListener("click", resetStats);
  }

  const closeOverlayButton = document.getElementById("close-overlay");
  if (closeOverlayButton) {
    closeOverlayButton.addEventListener("click", () => hideOverlay("overlay"));
  }

  const confirmOverlayButton = document.getElementById("confirm-overlay");
  if (confirmOverlayButton) {
    confirmOverlayButton.addEventListener("click", () => {
      hideOverlay("overlay");
      soundFor("win");
      showToast("✅ Confirmé");
      updateScore(10);
    });
  }
}

function startTimer() {
  setInterval(() => {
    updateStats();
  }, 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  startTimer();
  updateStats();
  hideOverlay("overlay");
  hideOverlay("joke-modal");
  hideOverlay("stats-modal");

  const fakeScreen = document.getElementById("fake-screen");
  if (fakeScreen) {
    fakeScreen.style.display = "none";
    fakeScreen.setAttribute("aria-hidden", "true");
  }

  const toast = document.getElementById("toast");
  if (toast) toast.classList.remove("show");
  document.body.classList.add("ready");
});

document.addEventListener("click", unlockAudio, { once: true });
