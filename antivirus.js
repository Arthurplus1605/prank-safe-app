// ============================================================
// PRANK SAFE ANTIVIRUS ENGINE v1.0
// Real-time threat detection & security monitoring
// ============================================================

class PrankSafeAntivirus {
  constructor() {
    this.threats = [];
    this.scanResults = [];
    this.quarantine = [];
    this.lastScanTime = null;
    this.isScanning = false;
    this.realTimeEnabled = true;
    this.threatDatabase = [
      { id: 'malware.cookie.stealer', severity: 'critical', name: 'Cookie Stealer', description: 'Tentative de vol de données utilisateur' },
      { id: 'spyware.tracker', severity: 'high', name: 'Tracker Malveillant', description: 'Surveillance non autorisée' },
      { id: 'pup.adware', severity: 'medium', name: 'Adware Potentiel', description: 'Publicités non souhaitées' },
      { id: 'virus.js.injection', severity: 'critical', name: 'Script Malveillant', description: 'Injection de code détectée' },
      { id: 'trojan.phishing', severity: 'high', name: 'Tentative de Phishing', description: 'Usurpation d\'identité' },
      { id: 'pup.ppi', severity: 'low', name: 'Logiciel Potentiellement Non Désiré', description: 'Contenu suspect' }
    ];
    this.fileCache = new Map();
    this.sessionThreats = 0;
    this.blockedThreats = 0;
  }

  // Initialize antivirus
  init() {
    console.log('🛡️ Antivirus Engine Initializing...');
    this.setupRealTimeMonitoring();
    this.schedulePeriodicScans();
    return { status: 'initialized', timestamp: new Date() };
  }

  // Real-time monitoring
  setupRealTimeMonitoring() {
    if (!this.realTimeEnabled) return;

    // Monitor local storage access
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = (key, value) => {
      this.analyzeStorageAccess(key, value);
      originalSetItem.call(localStorage, key, value);
    };

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      this.analyzeNetworkRequest(args[0]);
      return originalFetch.apply(window, args);
    };

    console.log('✅ Real-time monitoring active');
  }

  // Analyze storage access
  analyzeStorageAccess(key, value) {
    const suspiciousPatterns = [
      'password',
      'token',
      'secret',
      'credit',
      'card',
      'ssn',
      'apikey'
    ];

    const isSuspicious = suspiciousPatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );

    if (isSuspicious) {
      this.logThreat({
        type: 'storage_access',
        severity: 'medium',
        target: key,
        timestamp: new Date()
      });
    }
  }

  // Analyze network requests
  analyzeNetworkRequest(url) {
    try {
      const urlObj = new URL(url);
      const suspiciousDomains = [
        'malware.com',
        'phishing.net',
        'spyware.io',
        'ads-network.ru'
      ];

      const isSuspicious = suspiciousDomains.some(domain =>
        urlObj.hostname.includes(domain)
      );

      if (isSuspicious) {
        this.logThreat({
          type: 'network_request',
          severity: 'high',
          target: urlObj.hostname,
          timestamp: new Date()
        });

        this.blockedThreats++;
        return false;
      }
    } catch (e) {
      console.log('URL analysis skipped');
    }
  }

  // Full system scan
  async fullSystemScan() {
    this.isScanning = true;
    this.scanResults = [];
    console.log('🔍 Starting full system scan...');

    const scanSteps = [
      { name: 'Memory Scan', duration: 800 },
      { name: 'Storage Scan', duration: 600 },
      { name: 'Cache Analysis', duration: 500 },
      { name: 'Network Inspection', duration: 400 },
      { name: 'Script Analysis', duration: 700 },
      { name: 'Cookie Review', duration: 300 },
      { name: 'Final Verification', duration: 200 }
    ];

    let progress = 0;
    for (const step of scanSteps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      progress = Math.round((scanSteps.indexOf(step) + 1) / scanSteps.length * 100);
      this.updateScanProgress(progress, step.name);
    }

    this.lastScanTime = new Date();
    this.isScanning = false;

    // Simulate threat detection
    const detectedThreats = this.simulateThreatDetection();
    this.scanResults = detectedThreats;

    console.log(`✅ Scan complete. ${detectedThreats.length} threats detected.`);
    return {
      totalThreats: detectedThreats.length,
      critical: detectedThreats.filter(t => t.severity === 'critical').length,
      high: detectedThreats.filter(t => t.severity === 'high').length,
      medium: detectedThreats.filter(t => t.severity === 'medium').length,
      low: detectedThreats.filter(t => t.severity === 'low').length,
      scanTime: this.lastScanTime,
      results: detectedThreats
    };
  }

  // Quick scan
  async quickScan() {
    this.isScanning = true;
    console.log('⚡ Starting quick scan...');

    const quickSteps = ['Memory Check', 'Recent Files', 'Active Scripts'];
    let progress = 0;

    for (const step of quickSteps) {
      await new Promise(resolve => setTimeout(resolve, 400));
      progress = Math.round((quickSteps.indexOf(step) + 1) / quickSteps.length * 100);
      this.updateScanProgress(progress, step);
    }

    this.isScanning = false;
    const threats = this.simulateThreatDetection(3);

    console.log(`✅ Quick scan complete. ${threats.length} issues found.`);
    return threats;
  }

  // Simulate threat detection
  simulateThreatDetection(limit = null) {
    const numThreats = Math.floor(Math.random() * 4); // 0-3 random threats
    const detected = [];

    for (let i = 0; i < numThreats; i++) {
      const threat = this.threatDatabase[
        Math.floor(Math.random() * this.threatDatabase.length)
      ];
      detected.push({
        ...threat,
        detectedTime: new Date(),
        location: this.generateRandomLocation(),
        riskScore: Math.floor(Math.random() * 100) + 50
      });
    }

    this.sessionThreats += detected.length;
    return limit ? detected.slice(0, limit) : detected;
  }

  // Generate random file location
  generateRandomLocation() {
    const locations = [
      'localStorage[user_data]',
      'sessionStorage[token]',
      'window.globalVar',
      'localStorage[config]',
      'sessionStorage[preferences]',
      'cookies[session_id]',
      'indexedDB[app_data]'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  // Update scan progress
  updateScanProgress(progress, currentStep) {
    const event = new CustomEvent('scanProgress', {
      detail: { progress, currentStep }
    });
    window.dispatchEvent(event);
  }

  // Clean threats
  async cleanThreats(threatIds) {
    console.log('🧹 Cleaning threats...');
    const cleaned = [];

    for (const id of threatIds) {
      const threat = this.scanResults.find(t => t.id === id);
      if (threat) {
        this.quarantine.push({ ...threat, quarantineTime: new Date() });
        cleaned.push(id);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    this.scanResults = this.scanResults.filter(t => !threatIds.includes(t.id));
    console.log(`✅ Cleaned ${cleaned.length} threats`);
    return { cleaned: cleaned.length, remaining: this.scanResults.length };
  }

  // Log threat
  logThreat(threat) {
    this.threats.push({
      ...threat,
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    });

    this.sessionThreats++;

    const event = new CustomEvent('threatDetected', { detail: threat });
    window.dispatchEvent(event);
  }

  // Get system health
  getSystemHealth() {
    const healthScore = Math.max(0, 100 - (this.sessionThreats * 5));
    const status = healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Fair' : 'Poor';

    return {
      score: Math.round(healthScore),
      status,
      threatsDetected: this.sessionThreats,
      threatsBlocked: this.blockedThreats,
      lastScan: this.lastScanTime,
      scanningActive: this.isScanning
    };
  }

  // Get detailed report
  getDetailedReport() {
    return {
      summary: this.getSystemHealth(),
      recentThreats: this.threats.slice(-10),
      quarantineItems: this.quarantine,
      scanResults: this.scanResults,
      statistics: {
        totalScans: Math.floor(Math.random() * 50) + 10,
        threatsRemoved: this.quarantine.length,
        sessionDuration: new Date() - new Date(Date.now() - 3600000),
        protectionStatus: 'ACTIVE'
      }
    };
  }

  // Auto-update threat database
  async updateThreatDatabase() {
    console.log('🔄 Updating threat database...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Database updated. Latest threats loaded.');
    return { status: 'updated', timestamp: new Date() };
  }

  // Schedule periodic scans
  schedulePeriodicScans() {
    setInterval(() => {
      if (!this.isScanning && Math.random() > 0.85) {
        this.quickScan().catch(e => console.error('Scan error:', e));
      }
    }, 300000); // Every 5 minutes
  }

  // Export security report
  exportSecurityReport() {
    const report = this.getDetailedReport();
    return JSON.stringify(report, null, 2);
  }

  // Disable real-time protection
  disableRealTimeProtection() {
    this.realTimeEnabled = false;
    console.log('⚠️ Real-time protection disabled');
  }

  // Enable real-time protection
  enableRealTimeProtection() {
    this.realTimeEnabled = true;
    this.setupRealTimeMonitoring();
    console.log('✅ Real-time protection enabled');
  }
}

// ============================================================
// UI INTEGRATION FOR ANTIVIRUS
// ============================================================

const antivirus = new PrankSafeAntivirus();
antivirus.init();

// Add antivirus UI to the app
function initAntivirusUI() {
  const antivirusModal = document.createElement('div');
  antivirusModal.id = 'antivirus-modal';
  antivirusModal.className = 'overlay';
  antivirusModal.innerHTML = `
    <div class="modal">
      <div class="modal-top">
        <span>🛡️ Antivirus Protection</span>
        <button class="close-modal-btn" id="close-antivirus">✕</button>
      </div>
      
      <div style="text-align: center; margin: 16px 0;">
        <div id="health-score" style="font-size: 48px; font-weight: bold; color: #10b981;">100</div>
        <div style="color: var(--muted); font-size: 12px; margin-top: 4px;">Santé du système</div>
      </div>

      <div id="antivirus-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 20px;">🔍</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Menaces détectées</div>
          <div id="stat-threats" style="font-size: 16px; font-weight: bold; margin-top: 4px;">0</div>
        </div>
        <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 10px; text-align: center;">
          <div style="font-size: 20px;">✅</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Bloquées</div>
          <div id="stat-blocked" style="font-size: 16px; font-weight: bold; margin-top: 4px;">0</div>
        </div>
      </div>

      <div id="scan-progress" style="display: none; margin-bottom: 16px;">
        <div style="font-size: 12px; margin-bottom: 8px;">
          <span id="scan-step">Initialisation...</span>
          <span id="scan-percent" style="float: right;">0%</span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
          <div id="scan-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #8b5cf6, #ec4899); transition: width 0.3s ease;"></div>
        </div>
      </div>

      <div id="threats-list" style="margin-bottom: 16px; max-height: 200px; overflow-y: auto;"></div>

      <div class="modal-actions">
        <button class="ghost-btn" id="btn-quick-scan" style="flex: 1;">⚡ Quick Scan</button>
        <button class="primary-btn" id="btn-full-scan" style="flex: 1;">🔍 Full Scan</button>
      </div>
    </div>
  `;

  document.querySelector('.phone-shell').appendChild(antivirusModal);

  // Event listeners
  document.getElementById('close-antivirus').addEventListener('click', () => {
    document.getElementById('antivirus-modal').style.display = 'none';
  });

  document.getElementById('btn-quick-scan').addEventListener('click', async () => {
    document.getElementById('scan-progress').style.display = 'block';
    const results = await antivirus.quickScan();
    updateThreatsList(results);
    updateAntivirusUI();
  });

  document.getElementById('btn-full-scan').addEventListener('click', async () => {
    document.getElementById('scan-progress').style.display = 'block';
    const results = await antivirus.fullSystemScan();
    updateThreatsList(results.results);
    updateAntivirusUI();
  });

  // Listen for scan progress
  window.addEventListener('scanProgress', (e) => {
    const { progress, currentStep } = e.detail;
    document.getElementById('scan-bar').style.width = progress + '%';
    document.getElementById('scan-percent').textContent = progress + '%';
    document.getElementById('scan-step').textContent = currentStep;
  });

  updateAntivirusUI();
}

function updateAntivirusUI() {
  const health = antivirus.getSystemHealth();
  const healthScore = document.getElementById('health-score');
  const threatCount = document.getElementById('stat-threats');
  const blockedCount = document.getElementById('stat-blocked');

  healthScore.textContent = health.score;
  healthScore.style.color = health.score > 80 ? '#10b981' : health.score > 60 ? '#f59e0b' : '#ef4444';

  threatCount.textContent = health.threatsDetected;
  blockedCount.textContent = health.threatsBlocked;
}

function updateThreatsList(threats) {
  const list = document.getElementById('threats-list');
  list.innerHTML = '';

  if (threats.length === 0) {
    list.innerHTML = '<div style="text-align: center; color: var(--muted); font-size: 12px; padding: 16px;">✅ Aucune menace détectée</div>';
    return;
  }

  threats.forEach(threat => {
    const threatEl = document.createElement('div');
    threatEl.style.cssText = `
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
      font-size: 11px;
    `;
    threatEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <strong style="color: #fca5a5;">${threat.name}</strong>
        <span style="color: #ef4444; font-weight: bold;">${threat.severity.toUpperCase()}</span>
      </div>
      <div style="color: var(--muted);">${threat.description}</div>
      <div style="color: var(--muted); margin-top: 4px; font-size: 10px;">📍 ${threat.location}</div>
    `;
    list.appendChild(threatEl);
  });
}

// Add antivirus button to settings
function addAntivirusButton() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;

  const antivirusBtn = document.createElement('button');
  antivirusBtn.className = 'ghost-btn';
  antivirusBtn.style.cssText = 'width: 100%; margin-bottom: 10px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);';
  antivirusBtn.innerHTML = '🛡️ Protection antivirus';
  antivirusBtn.addEventListener('click', () => {
    document.getElementById('antivirus-modal').style.display = 'flex';
  });

  const settingsList = settingsModal.querySelector('.settings-list');
  if (settingsList) {
    settingsList.parentNode.insertBefore(antivirusBtn, settingsList);
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  initAntivirusUI();
  addAntivirusButton();
});

// Simulate threat detection periodically
setInterval(() => {
  if (Math.random() > 0.95) {
    antivirus.logThreat({
      type: 'random_detection',
      severity: ['low', 'medium'][Math.floor(Math.random() * 2)],
      target: 'background_process',
      timestamp: new Date()
    });
  }
}, 5000);

// Export antivirus for external use
window.PrankSafeAntivirus = antivirus;
