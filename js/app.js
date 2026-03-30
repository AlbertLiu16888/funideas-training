// ===== 樂點創意 工作人員教學驗收系統 =====

const APP = {
  // Google Apps Script Web App URL (部署後替換)
  API_URL: 'https://script.google.com/macros/s/AKfycbzj5VTM1WSWvcdoalxPXrKr3sbioeR5PWfS0-EWLftHYMlZBeiz3pA2kJXo9bfVjKxg/exec',
  PASSWORD: '1120',
  themes: {},
  currentTheme: null,
  currentStation: null,
  currentUser: '',
  teachingStep: 0,
  verifyStep: 0,
  verifyAnswers: [],
  boardData: [],
};

// ===== Initialization =====
async function init() {
  await loadThemes();
  checkLogin();
}

function checkLogin() {
  const loggedIn = sessionStorage.getItem('funideas_auth');
  if (loggedIn === APP.PASSWORD) {
    document.getElementById('login-screen').classList.add('hidden');
    showHome();
  }
}

function handleLogin() {
  const input = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  if (input.value === APP.PASSWORD) {
    sessionStorage.setItem('funideas_auth', APP.PASSWORD);
    document.getElementById('login-screen').classList.add('hidden');
    showHome();
  } else {
    errorEl.style.display = 'block';
    errorEl.textContent = '密碼錯誤，請重新輸入';
    input.value = '';
    input.focus();
  }
}

// ===== Theme Loading =====
async function loadThemes() {
  try {
    const res = await fetch('data/sherlock.json');
    const data = await res.json();
    APP.themes[data.id] = data;
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
}

// ===== Navigation =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function showHome() {
  showScreen('home-screen');
  renderThemeGrid();
}

function goBack(target) {
  if (target === 'home') showHome();
  else if (target === 'theme') showThemePage(APP.currentTheme.id);
  else if (target === 'station') showStationPage();
}

// ===== Home Screen =====
function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  const available = Object.values(APP.themes);

  // Placeholder themes
  const allThemes = [
    ...available,
    { id: 'monopoly', name: '謎走大富翁', icon: '🎲', color: '#e65100', disabled: true },
    { id: 'squid', name: '一起玩魷戲', icon: '🦑', color: '#880e4f', disabled: true },
  ];

  grid.innerHTML = allThemes.map(t => `
    <div class="card card-clickable theme-card ${t.disabled ? 'disabled' : ''}"
         onclick="${t.disabled ? '' : `showThemePage('${t.id}')`}">
      <div class="card-icon">${t.icon}</div>
      <div class="card-title">${t.name}</div>
      <div class="card-desc">${t.disabled ? '即將開放' : `${t.stations.length} 個工作崗位`}</div>
    </div>
  `).join('');

  // Board button
  grid.innerHTML += `
    <div class="card card-clickable theme-card" onclick="showBoard()" style="border: 2px dashed var(--primary)">
      <div class="card-icon">📊</div>
      <div class="card-title">驗收完成清單</div>
      <div class="card-desc">查看所有驗收記錄</div>
    </div>
  `;
}

// ===== Theme Page =====
function showThemePage(themeId) {
  APP.currentTheme = APP.themes[themeId];
  if (!APP.currentTheme) return;

  showScreen('theme-screen');

  document.getElementById('theme-title').textContent = `${APP.currentTheme.icon} ${APP.currentTheme.name}`;

  const nameInput = document.getElementById('user-name');
  if (APP.currentUser) nameInput.value = APP.currentUser;

  renderStationList();
}

function renderStationList() {
  const list = document.getElementById('station-list');
  list.innerHTML = APP.currentTheme.stations.map(s => `
    <div class="card card-clickable station-card" onclick="selectStation('${s.id}')">
      <div class="station-icon">${s.icon}</div>
      <div class="station-info">
        <div class="station-name">${s.name}</div>
        <div class="station-desc">${s.description}</div>
      </div>
      <div class="station-arrow">›</div>
    </div>
  `).join('');
}

function selectStation(stationId) {
  const nameInput = document.getElementById('user-name');
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.style.borderColor = 'var(--error)';
    nameInput.placeholder = '⚠️ 請先輸入姓名';
    nameInput.focus();
    return;
  }

  APP.currentUser = name;
  APP.currentStation = APP.currentTheme.stations.find(s => s.id === stationId);
  showStationPage();
}

function showStationPage() {
  showScreen('station-screen');
  document.getElementById('station-title').textContent =
    `${APP.currentStation.icon} ${APP.currentStation.name}`;
  document.getElementById('station-user-display').textContent = APP.currentUser;
}

// ===== Teaching Mode =====
function startTeaching() {
  APP.teachingStep = 0;
  showScreen('teaching-screen');
  document.getElementById('teaching-station-name').textContent = APP.currentStation.name;
  renderTeachingStep();
}

function renderTeachingStep() {
  const steps = APP.currentStation.teaching;
  const step = steps[APP.teachingStep];

  // Progress dots
  const dotsEl = document.getElementById('teaching-progress');
  dotsEl.innerHTML = steps.map((s, i) => `
    <div class="progress-dot ${i < APP.teachingStep ? 'done' : ''} ${i === APP.teachingStep ? 'active' : ''}">
      ${i < APP.teachingStep ? '✓' : i + 1}
    </div>
  `).join('');

  // Content
  const contentEl = document.getElementById('teaching-content');
  const previewHtml = step.preview ? `
    <div class="preview-section">
      <button class="btn btn-accent btn-full mt-1" onclick="togglePreview(this, '${step.preview}')">
        🖥️ 開啟系統預覽
      </button>
      <div class="preview-container hidden" style="margin-top:0.75rem">
        <iframe class="system-preview" data-src="${step.preview}"></iframe>
      </div>
    </div>
  ` : '';

  contentEl.innerHTML = `
    <div class="teaching-card card">
      <div class="step-label">步驟 ${step.step} / ${steps.length}</div>
      <h2>${step.title}</h2>
      <div class="content">${step.content}</div>
      ${step.tips ? `<div class="tips-box">${step.tips}</div>` : ''}
      ${previewHtml}
    </div>
  `;

  // Navigation
  const prevBtn = document.getElementById('teach-prev');
  const nextBtn = document.getElementById('teach-next');
  prevBtn.disabled = APP.teachingStep === 0;

  if (APP.teachingStep === steps.length - 1) {
    nextBtn.textContent = '✅ 完成教學';
    nextBtn.className = 'btn btn-success';
    nextBtn.onclick = finishTeaching;
  } else {
    nextBtn.textContent = '下一步 →';
    nextBtn.className = 'btn btn-primary';
    nextBtn.onclick = () => { APP.teachingStep++; renderTeachingStep(); };
  }
}

function prevTeachingStep() {
  if (APP.teachingStep > 0) {
    APP.teachingStep--;
    renderTeachingStep();
  }
}

function togglePreview(btn, url) {
  const container = btn.nextElementSibling;
  const iframe = container.querySelector('iframe');
  const isHidden = container.classList.contains('hidden');

  if (isHidden) {
    container.classList.remove('hidden');
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;
    }
    btn.textContent = '🖥️ 收起系統預覽';
  } else {
    container.classList.add('hidden');
    btn.textContent = '🖥️ 開啟系統預覽';
  }
}

function finishTeaching() {
  showStationPage();
}

// ===== Verification Mode =====
function startVerification() {
  APP.verifyStep = 0;
  APP.verifyAnswers = [];
  showScreen('verify-screen');
  document.getElementById('verify-station-name').textContent = APP.currentStation.name;
  renderVerifyQuestion();
}

function renderVerifyQuestion() {
  const questions = APP.currentStation.verification;
  const q = questions[APP.verifyStep];

  // Progress
  document.getElementById('verify-progress-text').textContent =
    `第 ${APP.verifyStep + 1} 題 / 共 ${questions.length} 題`;
  document.getElementById('verify-progress-fill').style.width =
    `${((APP.verifyStep) / questions.length) * 100}%`;

  // Question
  const contentEl = document.getElementById('verify-content');
  const letters = ['A', 'B', 'C', 'D'];

  contentEl.innerHTML = `
    <div class="question-card card">
      <div class="q-number">第 ${APP.verifyStep + 1} 題</div>
      <h2>${q.question}</h2>
      <div class="options-list" id="options-list">
        ${q.options.map((opt, i) => `
          <button class="option-btn" onclick="selectAnswer(${i})" data-index="${i}">
            <span class="option-letter">${letters[i]}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div id="answer-feedback"></div>
    </div>
  `;
}

function selectAnswer(index) {
  const q = APP.currentStation.verification[APP.verifyStep];
  const isCorrect = index === q.answer;
  const buttons = document.querySelectorAll('.option-btn');
  const feedbackEl = document.getElementById('answer-feedback');

  // Disable all buttons
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    const idx = parseInt(btn.dataset.index);
    if (idx === q.answer) btn.classList.add('correct');
    if (idx === index && !isCorrect) btn.classList.add('wrong');
  });

  // Show feedback
  feedbackEl.innerHTML = `
    <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}">
      ${isCorrect ? '✅ 正確！' : `❌ 答錯了！正確答案是：${q.options[q.answer]}`}
    </div>
    <button class="btn ${isCorrect ? 'btn-primary' : 'btn-accent'} btn-full mt-1" onclick="nextQuestion()">
      ${APP.verifyStep < APP.currentStation.verification.length - 1 ? '下一題 →' : '查看結果'}
    </button>
  `;

  APP.verifyAnswers.push({
    questionId: q.id,
    question: q.question,
    selected: index,
    correct: q.answer,
    isCorrect: isCorrect
  });
}

function nextQuestion() {
  APP.verifyStep++;
  if (APP.verifyStep >= APP.currentStation.verification.length) {
    showResult();
  } else {
    renderVerifyQuestion();
  }
}

// ===== Result Screen =====
function showResult() {
  showScreen('result-screen');

  const total = APP.verifyAnswers.length;
  const correct = APP.verifyAnswers.filter(a => a.isCorrect).length;
  const score = Math.round((correct / total) * 100);
  const passed = score >= 80;

  const resultEl = document.getElementById('result-content');
  resultEl.innerHTML = `
    <div class="result-card card">
      <div class="result-icon">${passed ? '🎉' : '📚'}</div>
      <h2>${passed ? '恭喜通過驗收！' : '尚未通過，請再加油！'}</h2>
      <div class="result-score">${score}分</div>
      <div class="result-detail">
        ${APP.currentUser} — ${APP.currentStation.name}<br>
        答對 ${correct} / ${total} 題 ${passed ? '（通過標準：80分）' : '（需達80分才能通過）'}
      </div>

      <div class="result-items">
        ${APP.verifyAnswers.map(a => `
          <div class="result-item">
            <span class="item-icon">${a.isCorrect ? '✅' : '❌'}</span>
            <span style="flex:1">${a.question}</span>
          </div>
        `).join('')}
      </div>

      <div class="result-actions">
        ${passed ? `
          <button class="btn btn-success btn-full" onclick="submitResult()" id="submit-btn">
            📤 提交驗收結果
          </button>
        ` : `
          <button class="btn btn-accent btn-full" onclick="startTeaching()">
            📖 重新學習
          </button>
          <button class="btn btn-outline btn-full" onclick="startVerification()">
            🔄 重新驗收
          </button>
        `}
        <button class="btn btn-outline btn-full" onclick="showStationPage()">
          ← 返回崗位
        </button>
      </div>
    </div>
  `;
}

// ===== Submit to Google Sheet =====
async function submitResult() {
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;margin:0"></span> 提交中...';

  const total = APP.verifyAnswers.length;
  const correct = APP.verifyAnswers.filter(a => a.isCorrect).length;
  const score = Math.round((correct / total) * 100);

  const passedItems = APP.verifyAnswers
    .filter(a => a.isCorrect)
    .map(a => a.question)
    .join('、');

  const failedItems = APP.verifyAnswers
    .filter(a => !a.isCorrect)
    .map(a => a.question)
    .join('、');

  const record = {
    timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
    name: APP.currentUser,
    theme: APP.currentTheme.name,
    station: APP.currentStation.name,
    score: score,
    total: total,
    correct: correct,
    passed: '通過',
    passedItems: passedItems,
    failedItems: failedItems || '無',
  };

  if (APP.API_URL) {
    try {
      await fetch(APP.API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error('Submit error:', e);
    }
  }

  // Also save locally
  saveLocalRecord(record);

  btn.innerHTML = '✅ 已提交成功！';
  btn.className = 'btn btn-success btn-full';

  // Show success message
  setTimeout(() => {
    showHome();
  }, 1500);
}

// ===== Local Storage =====
function saveLocalRecord(record) {
  const records = getLocalRecords();
  records.unshift(record);
  localStorage.setItem('funideas_records', JSON.stringify(records));
}

function getLocalRecords() {
  try {
    return JSON.parse(localStorage.getItem('funideas_records') || '[]');
  } catch {
    return [];
  }
}

// ===== Board =====
function showBoard() {
  showScreen('board-screen');
  renderBoard();
}

async function renderBoard(filter = 'all') {
  const boardListEl = document.getElementById('board-list');
  const filterEl = document.getElementById('board-filter');

  // Get records
  let records = [];

  // Try remote first
  if (APP.API_URL) {
    try {
      boardListEl.innerHTML = '<div class="loading"><div class="spinner"></div>載入中...</div>';
      const res = await fetch(APP.API_URL + '?action=getRecords');
      const data = await res.json();
      if (data && data.records) {
        records = data.records;
      }
    } catch (e) {
      console.error('Failed to fetch remote records:', e);
    }
  }

  // Fallback to local
  if (records.length === 0) {
    records = getLocalRecords();
  }

  // Build filter buttons
  const stations = [...new Set(records.map(r => r.station))];
  filterEl.innerHTML = `
    <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="renderBoard('all')">全部</button>
    ${stations.map(s => `
      <button class="filter-btn ${filter === s ? 'active' : ''}" onclick="renderBoard('${s}')">${s}</button>
    `).join('')}
  `;

  // Filter
  if (filter !== 'all') {
    records = records.filter(r => r.station === filter);
  }

  // Render
  if (records.length === 0) {
    boardListEl.innerHTML = `
      <div class="board-empty">
        <div style="font-size:3rem;margin-bottom:1rem">📋</div>
        <p>尚無驗收記錄</p>
        <p style="font-size:0.85rem;margin-top:0.5rem">完成驗收後記錄會顯示在這裡</p>
      </div>
    `;
    return;
  }

  boardListEl.innerHTML = records.map((r, i) => `
    <div class="board-item">
      <div class="rank ${i < 3 ? 'top' : ''}">${i + 1}</div>
      <div class="info">
        <div class="name">${r.name}</div>
        <div class="detail">${r.theme} — ${r.station} ・ ${r.score}分</div>
      </div>
      <div class="time">${r.timestamp}</div>
    </div>
  `).join('');
}

function refreshBoard() {
  renderBoard();
}

// ===== Init on Load =====
document.addEventListener('DOMContentLoaded', init);
