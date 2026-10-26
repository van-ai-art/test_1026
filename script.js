// 통화 메타데이터 (통화코드, 국가/통화명, 국기 이모지, 환율표 기준 단위)
const CURRENCIES = [
  { code: 'KRW', name: '대한민국 원', flag: '🇰🇷', unit: 1 },
  { code: 'USD', name: '미국 달러', flag: '🇺🇸', unit: 1 },
  { code: 'JPY', name: '일본 엔', flag: '🇯🇵', unit: 100 },
  { code: 'EUR', name: '유럽연합 유로', flag: '🇪🇺', unit: 1 },
  { code: 'CNY', name: '중국 위안', flag: '🇨🇳', unit: 1 },
  { code: 'GBP', name: '영국 파운드', flag: '🇬🇧', unit: 1 },
  { code: 'AUD', name: '호주 달러', flag: '🇦🇺', unit: 1 },
  { code: 'CAD', name: '캐나다 달러', flag: '🇨🇦', unit: 1 },
  { code: 'CHF', name: '스위스 프랑', flag: '🇨🇭', unit: 1 },
  { code: 'HKD', name: '홍콩 달러', flag: '🇭🇰', unit: 1 },
  { code: 'SGD', name: '싱가포르 달러', flag: '🇸🇬', unit: 1 },
  { code: 'TWD', name: '대만 달러', flag: '🇹🇼', unit: 1 },
  { code: 'THB', name: '태국 바트', flag: '🇹🇭', unit: 1 },
  { code: 'VND', name: '베트남 동', flag: '🇻🇳', unit: 100 }
];

// 오프라인/네트워크 오류 시 사용할 기본 환율 (1 USD 기준)
const FALLBACK_USD_RATES = {
  USD: 1,
  KRW: 1380.0,
  JPY: 152.5,
  EUR: 0.92,
  CNY: 7.24,
  GBP: 0.77,
  AUD: 1.51,
  CAD: 1.38,
  CHF: 0.86,
  HKD: 7.77,
  SGD: 1.32,
  TWD: 32.1,
  THB: 33.6,
  VND: 25300.0
};

// ---------------- 계산기 상태 및 로직 ----------------
const calcState = {
  currentInput: '0',
  previousInput: '',
  operator: null,
  shouldResetScreen: false,
  history: []
};

const calcExpressionEl = document.getElementById('calc-expression');
const calcResultEl = document.getElementById('calc-result');
const historyListEl = document.getElementById('history-list');

function formatNumberForCalc(numStr) {
  if (numStr === '오류' || numStr === 'Infinity' || numStr === '-Infinity' || numStr === 'NaN') {
    return '오류';
  }
  const parts = String(numStr).split('.');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? '.' + parts[1] : '';
  const sign = intPart.startsWith('-') ? '-' : '';
  const cleanInt = intPart.replace('-', '');
  if (!/^\d+$/.test(cleanInt)) return numStr;
  return sign + Number(cleanInt).toLocaleString('ko-KR') + decPart;
}

function getOperatorSymbol(op) {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
    default: return '';
  }
}

function updateCalcDisplay() {
  calcResultEl.textContent = formatNumberForCalc(calcState.currentInput);
  if (calcState.operator && calcState.previousInput !== '') {
    calcExpressionEl.textContent = `${formatNumberForCalc(calcState.previousInput)} ${getOperatorSymbol(calcState.operator)}`;
  } else {
    calcExpressionEl.textContent = '';
  }
}

function inputNumber(num) {
  if (calcState.currentInput === '오류') {
    calcState.currentInput = '0';
  }
  if (calcState.shouldResetScreen) {
    calcState.currentInput = num === '.' ? '0.' : num;
    calcState.shouldResetScreen = false;
    updateCalcDisplay();
    return;
  }
  if (num === '.') {
    if (!calcState.currentInput.includes('.')) {
      calcState.currentInput += '.';
    }
  } else {
    if (calcState.currentInput === '0') {
      calcState.currentInput = num;
    } else if (calcState.currentInput === '-0') {
      calcState.currentInput = '-' + num;
    } else if (calcState.currentInput.replace(/[-.]/g, '').length < 15) {
      calcState.currentInput += num;
    }
  }
  updateCalcDisplay();
}

function chooseOperator(op) {
  if (calcState.currentInput === '오류') return;
  if (calcState.operator !== null && !calcState.shouldResetScreen) {
    computeResult();
  }
  calcState.previousInput = calcState.currentInput;
  calcState.operator = op;
  calcState.shouldResetScreen = true;
  updateCalcDisplay();
}

function computeResult() {
  if (calcState.operator === null || calcState.previousInput === '') return;

  const prev = parseFloat(calcState.previousInput);
  const current = parseFloat(calcState.currentInput);
  if (isNaN(prev) || isNaN(current)) return;

  let result;
  switch (calcState.operator) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '*':
      result = prev * current;
      break;
    case '/':
      if (current === 0) {
        calcState.currentInput = '오류';
        calcState.previousInput = '';
        calcState.operator = null;
        calcState.shouldResetScreen = true;
        updateCalcDisplay();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  // 부동소수점 오차 보정
  const rounded = Number(Math.round(Number(result + 'e10')) + 'e-10');
  const exprString = `${formatNumberForCalc(String(prev))} ${getOperatorSymbol(calcState.operator)} ${formatNumberForCalc(String(current))}`;

  addHistory(exprString, String(rounded));

  calcState.currentInput = String(rounded);
  calcState.operator = null;
  calcState.previousInput = '';
  calcState.shouldResetScreen = true;
  updateCalcDisplay();
}

function clearCalculator() {
  calcState.currentInput = '0';
  calcState.previousInput = '';
  calcState.operator = null;
  calcState.shouldResetScreen = false;
  updateCalcDisplay();
}

function deleteLastDigit() {
  if (calcState.shouldResetScreen || calcState.currentInput === '오류') {
    calcState.currentInput = '0';
    calcState.shouldResetScreen = false;
    updateCalcDisplay();
    return;
  }
  if (calcState.currentInput.length === 1 || (calcState.currentInput.length === 2 && calcState.currentInput.startsWith('-'))) {
    calcState.currentInput = '0';
  } else {
    calcState.currentInput = calcState.currentInput.slice(0, -1);
  }
  updateCalcDisplay();
}

function toggleSign() {
  if (calcState.currentInput === '0' || calcState.currentInput === '오류') return;
  if (calcState.currentInput.startsWith('-')) {
    calcState.currentInput = calcState.currentInput.slice(1);
  } else {
    calcState.currentInput = '-' + calcState.currentInput;
  }
  updateCalcDisplay();
}

function applyPercent() {
  if (calcState.currentInput === '오류') return;
  const val = parseFloat(calcState.currentInput);
  if (isNaN(val)) return;
  const result = Number(Math.round(Number((val / 100) + 'e10')) + 'e-10');
  calcState.currentInput = String(result);
  updateCalcDisplay();
}

function addHistory(expr, res) {
  calcState.history.unshift({ expr, res });
  if (calcState.history.length > 20) {
    calcState.history.pop();
  }
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = '';
  if (calcState.history.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-history';
    emptyLi.textContent = '아직 계산 기록이 없습니다.';
    historyListEl.appendChild(emptyLi);
    return;
  }

  calcState.history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.title = '클릭하여 계산기에 값 불러오기';
    li.innerHTML = `
      <span class="expr">${item.expr} =</span>
      <span class="res">${formatNumberForCalc(item.res)}</span>
    `;
    li.addEventListener('click', () => {
      calcState.currentInput = item.res;
      calcState.shouldResetScreen = false;
      updateCalcDisplay();
    });
    historyListEl.appendChild(li);
  });
}

// 계산기 버튼 이벤트 바인딩
document.querySelectorAll('.calc-keypad .key-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if (val !== undefined) {
      if (['+', '-', '*', '/'].includes(val)) {
        chooseOperator(val);
      } else {
        inputNumber(val);
      }
    } else if (action) {
      if (action === 'clear') clearCalculator();
      else if (action === 'backspace') deleteLastDigit();
      else if (action === 'percent') applyPercent();
      else if (action === 'sign') toggleSign();
      else if (action === 'equals') computeResult();
    }
  });
});

document.getElementById('clear-history').addEventListener('click', () => {
  calcState.history = [];
  renderHistory();
});

// 키보드 입력 지원
window.addEventListener('keydown', (e) => {
  // 입력창에 포커스되어 있을 때는 계산기 단축키 무시
  if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    return;
  }

  if (e.key >= '0' && e.key <= '9') {
    inputNumber(e.key);
  } else if (e.key === '.') {
    inputNumber('.');
  } else if (['+', '-', '*', '/'].includes(e.key)) {
    e.preventDefault();
    chooseOperator(e.key);
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    computeResult();
  } else if (e.key === 'Backspace') {
    deleteLastDigit();
  } else if (e.key === 'Escape') {
    clearCalculator();
  } else if (e.key === '%') {
    applyPercent();
  }
});

// ---------------- 환율 변환 및 실시간 환율표 로직 ----------------
const exchangeState = {
  rates: { ...FALLBACK_USD_RATES }, // 1 USD 기준 각 통화 비율
  fromCurrency: 'USD',
  toCurrency: 'KRW',
  lastUpdated: null,
  isOfflineFallback: false
};

const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const fromAmountInput = document.getElementById('from-amount');
const toAmountInput = document.getElementById('to-amount');
const unitRateInfoEl = document.getElementById('unit-rate-info');
const rateUpdatedAtEl = document.getElementById('rate-updated-at');
const ratesGridEl = document.getElementById('rates-grid');

function populateCurrencySelects() {
  fromCurrencySelect.innerHTML = '';
  toCurrencySelect.innerHTML = '';

  CURRENCIES.forEach((curr) => {
    const opt1 = document.createElement('option');
    opt1.value = curr.code;
    opt1.textContent = `${curr.flag} ${curr.code} (${curr.name})`;
    fromCurrencySelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = curr.code;
    opt2.textContent = `${curr.flag} ${curr.code} (${curr.name})`;
    toCurrencySelect.appendChild(opt2);
  });

  fromCurrencySelect.value = exchangeState.fromCurrency;
  toCurrencySelect.value = exchangeState.toCurrency;
}

function getCrossRate(fromCode, toCode) {
  const fromRate = exchangeState.rates[fromCode];
  const toRate = exchangeState.rates[toCode];
  if (!fromRate || !toRate) return 0;
  return toRate / fromRate;
}

function formatCurrencyValue(val, code) {
  if (!isFinite(val)) return '0';
  const maxDigits = code === 'KRW' || code === 'JPY' || code === 'VND' ? 2 : 4;
  return val.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits
  });
}

function updateConversion() {
  const fromCode = fromCurrencySelect.value;
  const toCode = toCurrencySelect.value;
  exchangeState.fromCurrency = fromCode;
  exchangeState.toCurrency = toCode;

  const amount = parseFloat(fromAmountInput.value);
  const rate = getCrossRate(fromCode, toCode);

  if (isNaN(amount) || amount < 0) {
    toAmountInput.value = '0';
  } else {
    const converted = amount * rate;
    toAmountInput.value = formatCurrencyValue(converted, toCode);
  }

  // 단위 환율 안내 업데이트
  const fromMeta = CURRENCIES.find((c) => c.code === fromCode);
  const unit = fromMeta ? fromMeta.unit : 1;
  unitRateInfoEl.textContent = `${unit} ${fromCode} = ${formatCurrencyValue(rate * unit, toCode)} ${toCode}`;

  renderRatesGrid();
}

function renderRatesGrid() {
  ratesGridEl.innerHTML = '';
  const targetCurrencies = CURRENCIES.filter((c) => c.code !== 'KRW');

  targetCurrencies.forEach((curr) => {
    const rateToKRW = getCrossRate(curr.code, 'KRW') * curr.unit;
    const isSelected =
      exchangeState.fromCurrency === curr.code || exchangeState.toCurrency === curr.code;

    const card = document.createElement('div');
    card.className = `rate-card ${isSelected ? 'active' : ''}`;
    card.innerHTML = `
      <div class="rate-card-top">
        <span class="currency-badge">${curr.flag} ${curr.code}${curr.unit > 1 ? ` (${curr.unit})` : ''}</span>
        <span class="currency-name">${curr.name}</span>
      </div>
      <div class="rate-value">${ rateToKRW.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) } 원</div>
    `;

    card.addEventListener('click', () => {
      fromCurrencySelect.value = curr.code;
      toCurrencySelect.value = 'KRW';
      updateConversion();
    });

    ratesGridEl.appendChild(card);
  });
}

async function fetchExchangeRates() {
  rateUpdatedAtEl.textContent = '환율 불러오는 중...';
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('API 응답 오류');
    const data = await response.json();

    if (data && data.rates) {
      exchangeState.rates = { ...FALLBACK_USD_RATES, ...data.rates };
      exchangeState.isOfflineFallback = false;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      rateUpdatedAtEl.textContent = `실시간 기준 (${timeStr} 갱신)`;
    }
  } catch (err) {
    exchangeState.isOfflineFallback = true;
    rateUpdatedAtEl.textContent = '기본 환율 적용됨 (오프라인)';
  }
  updateConversion();
}

fromCurrencySelect.addEventListener('change', updateConversion);
toCurrencySelect.addEventListener('change', updateConversion);
fromAmountInput.addEventListener('input', updateConversion);

document.getElementById('swap-currencies').addEventListener('click', () => {
  const temp = fromCurrencySelect.value;
  fromCurrencySelect.value = toCurrencySelect.value;
  toCurrencySelect.value = temp;
  updateConversion();
});

document.getElementById('refresh-rates').addEventListener('click', () => {
  fetchExchangeRates();
});

// ---------------- 상단 뷰 탭 전환 (계산기 / 환율 / 계산기 + 환율) ----------------
const mainGridEl = document.getElementById('main-grid');
const viewTabBtns = document.querySelectorAll('.view-tab-btn');

function setViewMode(viewMode) {
  if (!mainGridEl) return;
  mainGridEl.setAttribute('data-view', viewMode);
  viewTabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewMode);
  });
}

viewTabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    setViewMode(btn.dataset.view);
  });
});

document.getElementById('send-to-converter').addEventListener('click', () => {
  const val = parseFloat(calcState.currentInput);
  if (!isNaN(val) && val >= 0) {
    if (mainGridEl && mainGridEl.getAttribute('data-view') === 'calc') {
      setViewMode('both');
    }
    fromAmountInput.value = val;
    updateConversion();
    fromAmountInput.focus();
  }
});

// ---------------- 다크 모드 테마 전환 ----------------
const themeToggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('calc-theme') || 'light';

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggleBtn.textContent = '🌙';
  }
}

applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('calc-theme', next);
  applyTheme(next);
});

// 초기화 실행
populateCurrencySelects();
updateCalcDisplay();
fetchExchangeRates();

// ---------------- 방문자 댓글 & 관리자 삭제 기능 ----------------
const ADMIN_PASSWORD_DEFAULT = '1234';
const COMMENTS_STORAGE_KEY = 'calc-comments-v1';

const commentState = {
  isAdmin: false,
  comments: []
};

const commentForm = document.getElementById('comment-form');
const commentAuthorInput = document.getElementById('comment-author');
const commentPasswordInput = document.getElementById('comment-password');
const commentContentInput = document.getElementById('comment-content');
const commentListEl = document.getElementById('comment-list');
const commentCountEl = document.getElementById('comment-count');

const adminToggleBtn = document.getElementById('admin-toggle-btn');
const adminBadge = document.getElementById('admin-badge');
const adminClearAllBtn = document.getElementById('admin-clear-all');
const adminAuthBox = document.getElementById('admin-auth-box');
const adminPwInput = document.getElementById('admin-pw-input');
const adminLoginConfirmBtn = document.getElementById('admin-login-confirm');
const adminLoginCancelBtn = document.getElementById('admin-login-cancel');
const adminAuthMsg = document.getElementById('admin-auth-msg');

function loadComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (raw) {
      commentState.comments = JSON.parse(raw);
    } else {
      commentState.comments = [
        {
          id: 'welcome-1',
          author: '관리자',
          content: '스마트 계산기 & 실시간 환율 웹앱에 오신 것을 환영합니다! 자유롭게 댓글을 남겨보세요.',
          password: '',
          createdAt: new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ];
      saveComments();
    }
  } catch (e) {
    commentState.comments = [];
  }
}

function saveComments() {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentState.comments));
}

function renderComments() {
  commentCountEl.textContent = String(commentState.comments.length);
  commentListEl.innerHTML = '';

  if (commentState.comments.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-comments';
    emptyLi.textContent = '아직 등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!';
    commentListEl.appendChild(emptyLi);
    return;
  }

  commentState.comments.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'comment-item';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'comment-item-header';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'comment-meta';

    const authorSpan = document.createElement('span');
    authorSpan.className = 'comment-author-name';
    authorSpan.textContent = item.author;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'comment-date';
    dateSpan.textContent = item.createdAt;

    metaDiv.appendChild(authorSpan);
    metaDiv.appendChild(dateSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = `comment-delete-btn ${commentState.isAdmin ? 'admin-mode-btn' : ''}`;
    deleteBtn.textContent = commentState.isAdmin ? '🗑️ 관리자 삭제' : '삭제';

    deleteBtn.addEventListener('click', () => {
      handleDeleteComment(item.id);
    });

    headerDiv.appendChild(metaDiv);
    headerDiv.appendChild(deleteBtn);

    const bodyP = document.createElement('p');
    bodyP.className = 'comment-body-text';
    bodyP.textContent = item.content;

    li.appendChild(headerDiv);
    li.appendChild(bodyP);
    commentListEl.appendChild(li);
  });
}

function handleDeleteComment(commentId) {
  const target = commentState.comments.find((c) => c.id === commentId);
  if (!target) return;

  // 관리자 모드일 경우 비밀번호 확인 없이 즉시 삭제 가능
  if (commentState.isAdmin) {
    if (confirm(`[관리자 권한] '${target.author}' 님의 댓글을 삭제하시겠습니까?`)) {
      commentState.comments = commentState.comments.filter((c) => c.id !== commentId);
      saveComments();
      renderComments();
    }
    return;
  }

  // 일반 사용자일 경우: 댓글 비밀번호 또는 관리자 비밀번호로 삭제 가능
  const inputPw = prompt('댓글 삭제를 위해 댓글 비밀번호(또는 관리자 비밀번호)를 입력해 주세요.');
  if (inputPw === null) return;

  if (inputPw === ADMIN_PASSWORD_DEFAULT || (target.password && inputPw === target.password)) {
    commentState.comments = commentState.comments.filter((c) => c.id !== commentId);
    saveComments();
    renderComments();
  } else {
    alert('비밀번호가 일치하지 않습니다. (관리자는 우측 상단 관리자 로그인 후 즉시 삭제할 수 있습니다.)');
  }
}

function updateAdminUI() {
  if (commentState.isAdmin) {
    adminBadge.classList.remove('hidden');
    adminClearAllBtn.classList.remove('hidden');
    adminToggleBtn.textContent = '🔓 관리자 로그아웃';
    adminAuthBox.classList.add('hidden');
  } else {
    adminBadge.classList.add('hidden');
    adminClearAllBtn.classList.add('hidden');
    adminToggleBtn.textContent = '🔒 관리자 로그인';
  }
  renderComments();
}

adminToggleBtn.addEventListener('click', () => {
  if (commentState.isAdmin) {
    commentState.isAdmin = false;
    updateAdminUI();
    return;
  }
  adminAuthBox.classList.toggle('hidden');
  if (!adminAuthBox.classList.contains('hidden')) {
    adminPwInput.value = '';
    adminPwInput.focus();
  }
});

function tryAdminLogin() {
  const pw = adminPwInput.value.trim();
  if (pw === ADMIN_PASSWORD_DEFAULT) {
    commentState.isAdmin = true;
    adminPwInput.value = '';
    updateAdminUI();
  } else {
    adminAuthMsg.innerHTML = '❌ <strong style="color:#ef4444;">비밀번호가 올바르지 않습니다. (초기 비밀번호: 1234)</strong>';
    adminPwInput.select();
  }
}

adminLoginConfirmBtn.addEventListener('click', tryAdminLogin);

adminPwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    tryAdminLogin();
  }
});

adminLoginCancelBtn.addEventListener('click', () => {
  adminAuthBox.classList.add('hidden');
});

adminClearAllBtn.addEventListener('click', () => {
  if (!commentState.isAdmin) return;
  if (commentState.comments.length === 0) {
    alert('삭제할 댓글이 없습니다.');
    return;
  }
  if (confirm('[관리자 권한] 등록된 모든 댓글을 삭제하시겠습니까?')) {
    commentState.comments = [];
    saveComments();
    renderComments();
  }
});

commentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const author = commentAuthorInput.value.trim();
  const content = commentContentInput.value.trim();
  const password = commentPasswordInput.value.trim();

  if (!author || !content) return;

  const nowStr = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const newComment = {
    id: 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    author,
    content,
    password,
    createdAt: nowStr
  };

  commentState.comments.unshift(newComment);
  saveComments();
  renderComments();

  commentContentInput.value = '';
  commentPasswordInput.value = '';
});

loadComments();
renderComments();

