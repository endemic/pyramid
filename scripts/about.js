const statsKeys = ['playedGames', 'wonGames' , 'highScore'];
const prefixed = key => `pyramid:${key}`;

const loadStats = () => {
  // Load any saved data
  statsKeys.forEach(key => {
    const val = localStorage.getItem(prefixed(key)) || 0;

    // write stats to page
    document.querySelector(`#${key}`).textContent = val;
  });
};

const resetStats = e => {
  e.preventDefault();

  dialog.show('Reset statistics?', () => {
    statsKeys.forEach(key => {
      localStorage.setItem(prefixed(key), 0);
    });

    loadStats();
  });
};

const showAboutScreen = e => {
  e.preventDefault();

  loadStats();

  // ensure correct "card draw" radio is selected
  document.querySelector(`#card-draw-${drawCount}`).checked = true;

  document.querySelector('#about').showModal();
};

const hideAboutScreen = e => {
  e.preventDefault();

  document.querySelector('#about').close();
};

const setCardDraw = e => {
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
