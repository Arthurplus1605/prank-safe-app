// Initialisation du contexte audio
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Fonction pour créer un son avec l'API Web Audio
function playTone(frequency, duration, type = "sine", volume = 0.1) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  setTimeout(() => oscillator.stop(), duration);
}

// Fonction pour créer des sons complexes
function playSound(soundName) {
  const ctx = getAudioContext();

  switch (soundName) {
    case "beep":
      playTone(800, 150, "sine", 0.1);
      break;

    case "error":
      playTone(400, 100, "square", 0.1);
      setTimeout(() => playTone(300, 100, "square", 0.1), 150);
      break;

    case "ping":
      playTone(1200, 80, "sine", 0.1);
      setTimeout(() => playTone(1600, 60, "sine", 0.1), 100);
      break;

    case "laugh":
      // Ha Ha Ha effect
      playTone(600, 150, "sine", 0.08);
      setTimeout(() => playTone(700, 150, "sine", 0.08), 200);
      setTimeout(() => playTone(800, 150, "sine", 0.08), 400);
      break;

    case "win":
      // Fanfare-like sound
      playTone(523, 150, "sine", 0.1); // Do
      setTimeout(() => playTone(659, 150, "sine", 0.1), 160); // Mi
      setTimeout(() => playTone(784, 300, "sine", 0.1), 320); // Sol
      break;

    case "drop":
      // Descending tone
      playTone(1000, 50, "sine", 0.1);
      setTimeout(() => playTone(800, 50, "sine", 0.1), 60);
      setTimeout(() => playTone(600, 50, "sine", 0.1), 120);
      setTimeout(() => playTone(400, 100, "sine", 0.1), 180);
      break;

    default:
      playTone(440, 100, "sine", 0.1);
  }
}

// ========== EVENT LISTENERS ==========

// Boutons Sound (Soundboard)
document.querySelectorAll(".sound-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tone = btn.dataset.tone;
    playSound(tone);
  });
});

// Boutons d'action (Notification, Crash, Blague, Sound)
document.querySelectorAll(".action-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    handleAction(action);
  });
});

// Fonction pour gérer les actions principales
function handleAction(action) {
  switch (action) {
    case "notification":
      showNotificationAlert();
      playSound("ping");
      break;

    case "crash":
      showFakeScreen();
      playSound("error");
      break;

    case "joke":
      showRandomJoke();
      playSound("laugh");
      break;

    case "sound":
      showOverlay();
      playSound("beep");
      break;

    default:
      break;
  }
}

// ========== AFFICHAGE DES ÉCRANS ==========

function showNotificationAlert() {
  const notificationList = document.getElementById("notification-list");
  const timestamp = new Date().toLocaleTimeString("fr-FR");
  
  const alert = document.createElement("div");
  alert.className = "alert-item";
  alert.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f0f0f0; border-radius: 8px; margin-bottom: 8px;">
      <div>
        <p style="margin: 0; font-weight: bold; color: #333;">Fausse alerte</p>
        <small style="color: #666;">${timestamp}</small>
      </div>
      <span style="cursor: pointer; color: #999;" onclick="this.parentElement.remove()">✕</span>
    </div>
  `;
  
  notificationList.insertBefore(alert, notificationList.firstChild);
  showToast("📢 Alerte ajoutée!");
}

function showFakeScreen() {
  const fakeScreen = document.getElementById("fake-screen");
  fakeScreen.setAttribute("aria-hidden", "false");
  fakeScreen.style.display = "flex";
  
  // Masquer après 3 secondes
  setTimeout(() => {
    fakeScreen.setAttribute("aria-hidden", "true");
    fakeScreen.style.display = "none";
  }, 3000);
}

function showRandomJoke() {
  const jokes = [
    "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant? Parce que sinon ils tombent dans le bateau!",
    "Qu'est-ce qu'un crocodile qui surveille la pharmacie? Un Lacoste-guard!",
    "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël? Un chaton de Noël!",
    "Qu'est-ce qu'un cannibale végétarien? Un humanitaire!",
    "Quel est le comble pour un électricien? De ne pas être au courant!",
  ];
  
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  alert("😂 Blague du jour:\n\n" + randomJoke);
  showToast("😂 Blague affichée!");
}

function showOverlay() {
  const overlay = document.getElementById("overlay");
  overlay.setAttribute("aria-hidden", "false");
  overlay.style.display = "flex";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// ========== MODAL CONTROLS ==========

document.getElementById("close-overlay")?.addEventListener("click", () => {
  const overlay = document.getElementById("overlay");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.display = "none";
  playSound("beep");
});

document.getElementById("confirm-overlay")?.addEventListener("click", () => {
  const overlay = document.getElementById("overlay");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.display = "none";
  showToast("✅ Confirmé!");
  playSound("win");
});

// ========== TAB NAVIGATION ==========

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    // Retirer la classe active de tous les tabs
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    // Ajouter la classe active au tab cliqué
    tab.classList.add("active");
    playSound("ping");
  });
});

// ========== ADD ALERT BUTTON ==========

document.getElementById("add-alert")?.addEventListener("click", () => {
  showNotificationAlert();
  playSound("ping");
});

// ========== FAKE SCREEN AUTO-HIDE ==========

const fakeScreen = document.getElementById("fake-screen");
if (fakeScreen) {
  fakeScreen.style.display = "none";
  fakeScreen.setAttribute("aria-hidden", "true");
}

// ========== MODAL AUTO-HIDE ==========

const overlay = document.getElementById("overlay");
if (overlay) {
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

// ========== SCORE MANAGEMENT ==========

let score = 12;

function addPoints(points) {
  score += points;
  document.getElementById("score").textContent = score;
}

// Ajouter des points lors des actions
document.querySelectorAll(".action-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    addPoints(5);
    showToast("+5 points! 🎉");
  });
});
