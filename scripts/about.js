const statsKeys = ['playedGames', 'wonGames' , 'highScore'];
const prefixed = key => `pyramid:${key}`;

const resetStats = e => {
  e.preventDefault();

  if (!confirm('Reset statistics?')) {
    return;
  }

  statsKeys.forEach(key => {
    localStorage.setItem(prefixed(key), 0);

    document.querySelector(`#${key}`).textContent = '0';
  });
};

const showAboutScreen = e => {
  e.preventDefault();

  // Load any saved data
  statsKeys.forEach(key => {
    const val = localStorage.getItem(prefixed(key)) || 0;

    // write stats to page
    document.querySelector(`#${key}`).textContent = val;
  });

  // ensure correct "card draw" radio is selected
  document.querySelector(`#card-draw-${drawCount}`).checked = true;

  document.querySelector('#about').style.display = 'block';
};

const hideAboutScreen = e => {
  e.preventDefault();

  document.querySelector('#about').style.display = 'none';
};

const setCardDraw = e => {
  e.preventDefault();

  const newDrawCount = parseInt(e.target.value, 10);
  // TODO: the radio input is checked even if this condition returns early
  if (!gameOver && drawCount !== newDrawCount && !confirm('Deal new game with changes?')) {
    return;
  }

  drawCount = newDrawCount;
  localStorage.setItem('pyramid:drawCount', newDrawCount);
  e.target.checked = true;

  // setting `firstGame` bypasses a confirmation check in `onDeal`
  firstGame = true;
  onDeal(e);
};

document.querySelectorAll('input[type=radio]').forEach(element => {
  element.addEventListener('click', setCardDraw);
});

document.querySelector('#reset').addEventListener('mouseup', resetStats);
document.querySelector('#return').addEventListener('mouseup', hideAboutScreen);

document.querySelector('#reset').addEventListener('touchend', resetStats);
document.querySelector('#return').addEventListener('touchend', hideAboutScreen);
