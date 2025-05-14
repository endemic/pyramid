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
  // these might not be needed?
  // e.preventDefault();
  // e.target.checked = true;

  const drawCount = parseInt(e.target.value, 10);
  localStorage.setItem('pyramid:drawCount', drawCount);
};

document.querySelectorAll('input[type=radio]').forEach(element => {
  element.addEventListener('click', setCardDraw);
});

document.querySelector('#reset').addEventListener('mouseup', resetStats);
document.querySelector('#return').addEventListener('mouseup', hideAboutScreen);

document.querySelector('#reset').addEventListener('touchend', resetStats);
document.querySelector('#return').addEventListener('touchend', hideAboutScreen);
