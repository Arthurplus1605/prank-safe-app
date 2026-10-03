const notificationList = document.getElementById('notification-list');
const overlay = document.getElementById('overlay');
const fakeScreen = document.getElementById('fake-screen');
const toast = document.getElementById('toast');
const scoreEl = document.getElementById('score');

const alertTemplates = [
  { title: 'Mise à jour', text: 'Une nouvelle version de votre interface a été détectée.' },
  { title: 'Erreur réseau', text: 'Le système a tenté de localiser une connexion absente.' },
  { title: 'Vérification', text: 'L’application vérifie les paramètres de sécurité du mode amusant.' },
  { title: 'Notification', text: 'Une alerte spéciale a été envoyée dans le système de blagues.' },
  { title: 'Scan terminé', text: 'Le rapport est prêt : tout est en ordre et en train de rire.' },
  { title: 'Récupération', text: 'Le téléphone restaure son humeur normale en mode prank safe.' }
];

const jokes = [
  'Pourquoi le clavier a ri ? Parce qu’il avait une touche de folie.',
  'Mon écran est hilarant : il ne sait pas arrêter de faire des blagues.',
  'Le café de l’ordinateur ? Un espresso de debug.',
  'J’ai demandé à mon téléphone de rigoler… il a affiché un emoji.',
  'Pourquoi le bouton “OK” est joyeux ? Parce qu’il aime les bonnes réponses.',
  'Mon ordinateur a mis une blague sur pause… il avait besoin d’un petit reboot.'
];

const soundMap = {
  beep: { frequency: 440, duration: 0.12, type: 'square' },
  error: { frequency: 180, duration: 0.28, type: 'sawtooth' },
  ping: { frequency: 660, duration: 0.08, type: 'triangle' },
  laugh: { frequency: 260, duration: 0.35, type: 'sine' },
  win: { frequency: 520, duration: 0.2, type: 'triangle' },
  drop: { frequency: 120, duration: 0.5, type: 'sine' }
};

let score = 12;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function addNotification(title, text) {
  const item = document.createElement('div');
  item.className = 'notification-item';

  item.innerHTML = `
    <span class="notification-dot"></span>
    <div class="notification-text">
      <strong>${title}</strong>
      <span>${text}</span>
    </div>
  `;

  notificationList.prepend(item);
  score += 1;
  scoreEl.textContent = score;
}

function randomAlert() {
  const item = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
  addNotification(item.title, item.text);
  showToast('📣 Alerte simulée ajoutée');
}

function openOverlay() {
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay() {
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
}

function showCrashScreen() {
  fakeScreen.classList.add('show');
  fakeScreen.setAttribute('aria-hidden', 'false');
  showToast('💥 Faux écran d’erreur affiché');
  setTimeout(() => {
    fakeScreen.classList.remove('show');
    fakeScreen.setAttribute('aria-hidden', 'true');
  }, 2200);
}

function randomJoke() {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  showToast(joke);
  score += 2;
  scoreEl.textContent = score;
}

function playTone(name) {
  const audioCtx = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx) {
    showToast('⚠️ Audio non disponible');
    return;
  }

  const context = new audioCtx();
  const tone = soundMap[name];
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = tone.type;
  oscillator.frequency.value = tone.frequency;
  gainNode.gain.value = 0.08;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + tone.duration);

  setTimeout(() => context.close(), tone.duration * 1000 + 80);
}

function seedNotifications() {
  [
    { title: 'Système OK', text: 'Le mode prank safe est prêt à l’emploi.' },
    { title: 'Mise en route', text: 'Les éléments de blague ont été chargés.' },
    { title: 'Joyeux mode', text: 'Les alertes sont prêtes à faire rire.' }
  ].forEach(item => addNotification(item.title, item.text));
}

function bindActions() {
  document.querySelector('[data-action="notification"]').addEventListener('click', () => {
    openOverlay();
    randomAlert();
  });

  document.querySelector('[data-action="crash"]').addEventListener('click', showCrashScreen);
  document.querySelector('[data-action="joke"]').addEventListener('click', randomJoke);
  document.querySelector('[data-action="sound"]').addEventListener('click', () => {
    const tones = Object.keys(soundMap);
    const randomTone = tones[Math.floor(Math.random() * tones.length)];
    playTone(randomTone);
    showToast('🔊 Effet sonore lancé');
  });

  document.getElementById('add-alert').addEventListener('click', randomAlert);
  document.getElementById('close-overlay').addEventListener('click', closeOverlay);
  document.getElementById('confirm-overlay').addEventListener('click', closeOverlay);

  document.querySelectorAll('.sound-btn').forEach(button => {
    button.addEventListener('click', () => {
      playTone(button.dataset.tone);
      showToast(`🔊 ${button.textContent} joué`);
    });
  });
}

seedNotifications();
bindActions();
