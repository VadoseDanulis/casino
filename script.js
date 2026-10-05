const defaultState = {
  balance: 1000,
  wins: 0,
  losses: 0,
  streak: 0,
  bestStreak: 0,
};

const storedState = JSON.parse(localStorage.getItem('luckyPalaceState') || 'null');
const state = { ...defaultState, ...(storedState || {}) };

const balanceLabel = document.getElementById('balance');
const statusText = document.getElementById('status-text');
const statusTag = document.getElementById('status-tag');
const resetBtn = document.getElementById('reset-btn');
const addChipsBtn = document.getElementById('add-chips');
const gameButtons = document.querySelectorAll('.game-btn');
const streakLabel = document.getElementById('streak');
const winsLabel = document.getElementById('wins');
const lossesLabel = document.getElementById('losses');
const bestStreakLabel = document.getElementById('best-streak');

function saveState() {
  localStorage.setItem('luckyPalaceState', JSON.stringify({
    balance: state.balance,
    wins: state.wins,
    losses: state.losses,
    streak: state.streak,
    bestStreak: state.bestStreak,
  }));
}

function updateStats() {
  balanceLabel.textContent = state.balance;
  streakLabel.textContent = state.streak;
  winsLabel.textContent = state.wins;
  lossesLabel.textContent = state.losses;
  bestStreakLabel.textContent = state.bestStreak;
}

function setStatus(message, tone = 'live') {
  statusText.textContent = message;
  statusText.style.color = tone === 'win' ? '#39d98a' : tone === 'lose' ? '#ffb0b0' : '#edf5ff';
  statusTag.textContent = tone === 'win' ? 'VÝHRA' : tone === 'lose' ? 'PROHRA' : 'LIVE';
  statusTag.className = `status-tag ${tone}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampBet(value, min = 10) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.floor(parsed)) : min;
}

function validateBet(inputValue) {
  const bet = clampBet(inputValue);
  if (bet > state.balance) {
    setStatus('Nemáš dostatek peněz na tuto sázku.', 'lose');
    return null;
  }
  return bet;
}

function processRound({ bet, isWin, winText, loseText, winPayout = 0 }) {
  if (isWin) {
    state.balance += winPayout;
    state.wins += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    setStatus(winText, 'win');
  } else {
    state.balance -= bet;
    state.losses += 1;
    state.streak = 0;
    setStatus(loseText, 'lose');
  }

  saveState();
  updateStats();
}

function handleCoinFlip() {
  const bet = validateBet(document.getElementById('coin-bet').value);
  if (bet === null) return;

  const chosen = document.querySelector('input[name="coin-pick"]:checked').value;
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const isWin = chosen === result;

  processRound({
    bet,
    isWin,
    winText: `Výhra! Padlo ${result === 'heads' ? 'hlava' : 'panna'} a získal jsi ${bet} € bonusu.`,
    loseText: `Prohra! Padlo ${result === 'heads' ? 'hlava' : 'panna'} a ztratil jsi ${bet} €.`,
    winPayout: bet,
  });
}

function handleDice() {
  const bet = validateBet(document.getElementById('dice-bet').value);
  if (bet === null) return;

  const picked = Number(document.getElementById('dice-pick').value);
  const rolled = randomInt(1, 6);
  const isWin = picked === rolled;

  processRound({
    bet,
    isWin,
    winText: `Výhra! Kostka padla na ${rolled}, trefil jsi ${picked}. Zisk: ${bet * 5} €.`,
    loseText: `Prohra! Kostka padla na ${rolled}, ale tip ${picked} nevyšel. Ztráta: ${bet} €.`,
    winPayout: bet * 5,
  });
}

function handleSlots() {
  const bet = validateBet(document.getElementById('slots-bet').value);
  if (bet === null) return;

  const symbols = ['🍒', '🍋', '⭐', '💎', '7️⃣'];
  const slotEls = [
    document.getElementById('slot-1'),
    document.getElementById('slot-2'),
    document.getElementById('slot-3'),
  ];

  const result = Array.from({ length: 3 }, () => symbols[randomInt(0, symbols.length - 1)]);
  slotEls.forEach((el, index) => {
    el.textContent = result[index];
  });

  const unique = new Set(result).size;
  const isWin = unique === 1 || unique === 2;

  if (isWin) {
    const payout = unique === 1 ? bet * 10 : bet * 2;
    processRound({
      bet,
      isWin: true,
      winText: `JACKPOT! Výsledky: ${result.join(' ')} — vyhrál jsi ${payout} €.`,
      loseText: '',
      winPayout: payout,
    });
  } else {
    processRound({
      bet,
      isWin: false,
      winText: '',
      loseText: `Spun! Výsledky: ${result.join(' ')} — prohrál jsi ${bet} €.`,
      winPayout: 0,
    });
  }
}

function handleGuess() {
  const bet = validateBet(document.getElementById('guess-bet').value);
  if (bet === null) return;

  const guessed = Number(document.getElementById('guess-pick').value);
  const target = randomInt(1, 10);
  const isWin = guessed === target;

  processRound({
    bet,
    isWin,
    winText: `Výhra! Číslo bylo ${target}. Trefil jsi jackpot a získal ${bet * 8} €.`,
    loseText: `Prohra! Číslo bylo ${target}, neuhodl jsi správně. Ztráta: ${bet} €.`,
    winPayout: bet * 8,
  });
}

function handleRoulette() {
  const bet = validateBet(document.getElementById('roulette-bet').value);
  if (bet === null) return;

  const chosen = document.querySelector('input[name="roulette-pick"]:checked').value;
  const colors = ['red', 'black', 'green'];
  const result = colors[randomInt(0, colors.length - 1)];
  const isWin = chosen === result;

  if (result === 'green') {
    const greenPayout = bet * 12;
    processRound({
      bet,
      isWin,
      winText: isWin ? `Zelená! Vyhrál jsi ${greenPayout} €.` : `Padla zelená, prohrál jsi ${bet} €.`,
      loseText: `Padla zelená, prohrál jsi ${bet} €.`,
      winPayout: isWin ? greenPayout : 0,
    });
    return;
  }

  const payout = isWin ? bet * 2 : 0;
  processRound({
    bet,
    isWin,
    winText: `Výhra! Padla ${result} a vyhrál jsi ${payout} €.`,
    loseText: `Prohra! Padla ${result} a ztratil jsi ${bet} €.`,
    winPayout: payout,
  });
}

function resetGame() {
  Object.assign(state, defaultState);
  saveState();
  updateStats();
  setStatus('Hra byla resetována. Jsi znovu připraven na nový start!', 'live');
}

addChipsBtn.addEventListener('click', () => {
  state.balance += 500;
  saveState();
  updateStats();
  setStatus('Přidal jsi si 500 € do účtu.', 'win');
});

gameButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'coin') handleCoinFlip();
    if (action === 'dice') handleDice();
    if (action === 'slots') handleSlots();
    if (action === 'guess') handleGuess();
    if (action === 'roulette') handleRoulette();
  });
});

resetBtn.addEventListener('click', resetGame);

updateStats();
setStatus('Vítej ve hře! Vyber si minihru a vsad.', 'live');