const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const DEBUG = false;

// used for custom double-click/tap implementation
// this val is set in `onDown` function; if it is called again rapidly
// (e.g. within 500ms) then the interaction counts as a double-click
let lastOnDownTimestamp = Date.now();

// stores the last click/touch point; used because double-clicks
// need to be close together
let previousPoint = { x: 0, y: 0};

// array to hold inverse move data
const undoStack = [];

// boolean which can be checked to short-circuit player interaction, etc.
let gameOver = true;

// allow deal without confirmation on app load
let firstGame = true;

// current time elapsed in seconds
let time = 0;

let score = 0;

// how many cards the player flips over at a time; can be 1 or 3
let drawCount = parseInt(localStorage.getItem('pyramid:drawCount'), 10) || 3;

const cascades = [];
for (let i = 0; i < 7; i += 1) {
  // these don't have a visible component,
  // so we don't need to append them to the DOM
  cascades.push(new Cascade());
}

const foundations = [];
for (let i = 0; i < 4; i += 1) {
  const foundation = new Foundation();
  foundations.push(foundation);

  // Make these visible by adding to DOM
  document.body.append(foundation.element);
}

const wastes = [];
for (let i = 0; i < 3; i += 1) {
  const waste = new Waste();
  waste.zIndex = i === 0 ? 0 : i + 24; // 24 is max number that can be in talon
  wastes.push(waste);

  // Only show the background for the first waste slot
  if (i === 0) {
    document.body.append(waste.element);
  }
}

const talon = new Talon();
document.body.append(talon.element);

const grabbed = new Grabbed();

// array to hold refs to each card obj
const cards = [];

// initialize list of cards
SUITS.forEach(suit => {
  RANKS.forEach(rank => {
    // instantiate new card object
    const card = new Card(suit, rank);

    // add the card's HTML to the page
    document.body.append(card.element);

    // add the card object to a ref list
    cards.push(card);
  });
});

if (DEBUG) {
  for (let i = 0; i < foundations.length; i += 1) {
    let foundation = foundations[i];

    // move all cards to winning positions
    for (let j = 0; j < 13; j += 1) {
      let card = cards[(13 * i) + j];
      card.flip();
      let parent = foundation.lastCard;
      card.setParent(parent);
      card.moveTo(parent.x, parent.y);
    }
  }
}

const addToScore = p => {
  score += p;

  if (score < 0) {
    score = 0;
  }

  document.querySelector('#score').textContent = `Score: ${score}`;
};

const checkWin = () => {
  // ensure that each foundation has 13 cards; we don't check for matching suit
  // or ascending rank because those checks are done when the card is played
  return foundations.every(f => {
    let count = 0;

    for (let _card of f.children()) {
      count += 1;
    }

    return count === 13;
  });
};

const attemptToPlayOnFoundation = async card => {
  for (let i = 0; i < foundations.length; i += 1) {
    const foundation = foundations[i];

    if (foundation.validPlay(card)) {
      const parent = foundation.lastCard;  // either a card or the foundation itself
      const points = 10;  // always get 10 points for playing on a foundation

      addToScore(points);

      undoStack.push({
        card,
        parent,
        oldParent: card.parent,
        points
      });

      card.setParent(parent);
      card.zIndex = 52; // ensure card doesn't animate _under_ others
      card.animateTo(parent.x, parent.y);

      // show a brief "flash" when the card is close to the foundation
      wait(150).then(() => card.flash());

      // Ensure card z-index is correct _after_ it animates
      wait(250).then(() => card.resetZIndex());

      log(`playing ${card} on foundation #${i}`);

      if (checkWin()) {
        gameOver = true;

        // increment games won counter
        let key = 'pyramid:wonGames';
        let wonGames = parseInt(localStorage.getItem(key), 10) || 0;
        localStorage.setItem(key, wonGames + 1);

        // add bonus time points to score
        if (time >= 30) {
          addToScore(Math.round(700000 / time));
        }

        // check for high score
        key = 'pyramid:highScore';
        let highScore = parseInt(localStorage.getItem(key), 10) || 0;
        if (score > highScore) {
          localStorage.setItem(key, score);
        }

        // wait for animation to finish
        await waitAsync(250);

        CardWaterfall.start(() => {
          reset();
          stackCards();
        });
      }

      // if we have a valid play, return from this function;
      return;
    }
  }
};

const reset = () => {
  cards.forEach(c => {
    c.parent = null;
    c.child = null;
    c.flip('down');
    c.invert(false);
  });

  cascades.forEach(c => c.child = null);
  foundations.forEach(f => f.child = null);
  wastes.forEach(w => w.child = null);
  talon.child = null;

  time = 0;
  score = 0;
  document.querySelector('#time').textContent = `Time: ${time}`;
  document.querySelector('#score').textContent = `Score: ${score}`;

  undoStack.length = 0; // hack to empty an array
};

const stackCards = () => {
  // shuffle deck
  let currentIndex = cards.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [cards[currentIndex], cards[randomIndex]] = [cards[randomIndex], cards[currentIndex]];
  }

  // move all cards to the talon
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    card.moveTo(talon.x, talon.y);
    card.setParent(talon.lastCard);
    card.zIndex = index;
  }
};

const deal = async () => {
  const lastCascade = cascades[cascades.length - 1];
  let index = 0;

  // the last cascade should have 7 cards when all are dealt
  while (lastCascade.cardCount < 7) {
    const card = talon.lastCard;
    const cascade = cascades[index];

    if (cascade.cardCount === index + 1) {
      index = index + 1 >= cascades.length ? 0 : index + 1;
      log(`going to next cascade: ${index}`);
      continue;
    }

    // offset for dropping face up cards is handled by the `Grabbed` class
    let offset = cascade.cardCount === 0 ? 0 : card.offset;
    let lastCard = cascade.lastCard;
    card.setParent(lastCard);
    card.animateTo(lastCard.x, lastCard.y + offset, 600);
    wait(200).then(() => card.zIndex = lastCard.zIndex + 1);

    if (cascade.cardCount === index + 1) {
      card.flip();
    }

    await waitAsync(75);
    index = index + 1 >= cascades.length ? 0 : index + 1;
  }

  // increment games played counter
  const key = 'pyramid:playedGames';
  let playedGames = parseInt(localStorage.getItem(key), 10) || 0;
  localStorage.setItem(key, playedGames + 1);

  gameOver = false;
};

const resetTalon = e => {
  e.preventDefault();

  // need a way to group multiple "actions" as a single group in order to undo
  // if `undo` method finds an array, it will process each of the elements
  const undoGroup = [];

  // flip wastes in reverse order; otherwise the first two cards are put in the wrong place
  // this is due to the stupid way I implemented three card draw, with two extra "waste" stacks
  for (let i = wastes.length - 1; i >= 0; i -= 1) {
    const waste = wastes[i];

    while (waste.hasCards) {
      const card = waste.lastCard;
      const parent = talon.lastCard;

      undoGroup.push({
        card,
        parent,
        oldParent: card.parent,
        flip: true
      });

      card.setParent(parent);
      card.zIndex = parent.zIndex + 1
      card.moveTo(parent.x, parent.y);
      card.flip('down');
    }
  }

  // when playing single card draw, recycling the waste loses you points
  const points = drawCount === 1 ? -100 : 0;

  addToScore(points);

  undoGroup.push({ points });

  undoStack.push(undoGroup);
};

// The talon DOM element is hidden; can only be clicked
// when it "runs out" of cards
talon.element.addEventListener('mousedown', resetTalon);
talon.element.addEventListener('touchstart', resetTalon);

cards.forEach(card => {
  const onDown = async e => {
    e.preventDefault();

    if (gameOver) {
      return;
    }

    const point = getPoint(e);
    const delta = Date.now() - lastOnDownTimestamp;
    const doubleClick = delta < 500 && dist(point, previousPoint) < 15;
    const stack = card.stack;

    log(`double-click: ${doubleClick}; delta: ${delta}`);

    // reset the timestamp that stores the last time the player clicked
    // if the current click counts as "double", then set the timestamp way in the past
    // otherwise you get a "3 click double click" because the 2nd/3rd clicks are too close together
    lastOnDownTimestamp = doubleClick ? 0 : Date.now();
    previousPoint = point;

    if (stack.type === 'talon') {
      // NOTE: win3 solitaire only allows a single undo!
      // its 3 card draw shows the last 3 cards; if you play those,
      // then the rest are in a single pile beneath

      const undoGroup = [];

      // move any cards in wastes[2]/wastes[1] to wastes[0]
      // do wastes[1] first so the cards will be in order
      if (wastes[1].hasCards) {
        const card = wastes[1].lastCard;
        const parent = wastes[0].lastCard;

        undoGroup.push({
          card,
          parent,
          oldParent: card.parent
        });

        card.setParent(parent);
        card.animateTo(parent.x, parent.y); // TODO: maybe animate here?
        card.zIndex = parent.zIndex + 1;
      }

      if (wastes[2].hasCards) {
        const card = wastes[2].lastCard;
        const parent = wastes[0].lastCard;

        undoGroup.push({
          card,
          parent,
          oldParent: card.parent
        });

        card.setParent(parent);
        card.animateTo(parent.x, parent.y); // TODO: maybe animate here?
        card.zIndex = parent.zIndex + 1;
      }

      for (let i = 0; i < drawCount; i += 1) {
        // we've run out of cards
        if (talon.cardCount === 0) {
          continue;
        }

        const card = talon.lastCard;
        const parent = wastes[i].lastCard;

        undoGroup.push({
          card,
          parent,
          oldParent: card.parent,
          flip: true
        });

        card.setParent(parent);
        card.animateTo(parent.x, parent.y, 500);
        card.flip();
        wait(50).then(() => card.zIndex = parent.zIndex + 1);
        await waitAsync(50);
      }

      undoStack.push(undoGroup);

      return;
    }

    // don't allow cards in waste to be picked up if there are
    // cards in "higher" waste stacks
    if (stack.type === 'waste') {
      for (let i = wastes.length - 1; i >= 0; i -= 1) {
        if (wastes[i] === stack) {
          console.log(`no need to keep checking if cards are "above" clicked waste`);
          break;
        }

        if (wastes[i].hasCards) {
          console.log(`waste ${i} still has cards`);
          return;
        }
      }
    }

    if (!card.faceUp && card.hasCards) {
      log(`can't pick up a card stack that's not face up`);
      return;
    }

    if (!card.faceUp && !card.hasCards) {
      const points = 5;
      const flip = true;

      addToScore(points);

      undoStack.push({
        card,
        flip,
        points
      });

      card.flip();

      return;
    }

    // can only double-click to play on a foundation
    // if card is last in a cascade/cell
    if (doubleClick && !card.hasCards && !card.animating) {
      log(`double click! attempt to play ${card} on foundations`);
      attemptToPlayOnFoundation(card);
      return;
    }

    // only allow alternating sequences of cards to be picked up
    // TODO: can possibly remove this check
    if (!card.childrenInSequence) {
      console.log(`can't pick up ${card}, not a sequence!`);
      return;
    }

    grabbed.grab(card);
    grabbed.setOffset(point);

    log(`onDown on ${card}, offset: ${point.x}, ${point.y}`);
  };

  card.element.addEventListener('mousedown', onDown);
  card.element.addEventListener('touchstart', onDown);
});

const onMove = e => {
  e.preventDefault();

  if (!grabbed.hasCards) {
    return;
  }

  const point = getPoint(e);

  grabbed.moveTo(point);
};

const onUp = async e => {
  e.preventDefault();

  if (!grabbed.hasCards) {
    return;
  }

  const card = grabbed.child;

  // check foundations
  for (let i = 0; i < foundations.length; i += 1) {
    const foundation = foundations[i];

    // only allow placement in foundation if a valid play, and
    // player is holding a single card
    if (grabbed.overlaps(foundation) && foundation.validPlay(card) && !card.hasCards) {
      const parent = foundation.lastCard;

      // 10 points for putting card on foundation (from anywhere)
      const points = 10;

      addToScore(points);

      undoStack.push({
        card,
        parent,
        oldParent: card.parent,
        points
      });

      grabbed.drop(parent); // either a card or the foundation itself
      wait(150).then(() => card.flash());

      console.log(`dropping ${card} on foundation #${i}`);

      if (checkWin()) {
        gameOver = true;

        // increment games won counter
        let key = 'pyramid:wonGames';
        let wonGames = parseInt(localStorage.getItem(key), 10) || 0;
        localStorage.setItem(key, wonGames + 1);

        // add bonus time points to score
        if (time >= 30) {
          addToScore(Math.round(700000 / time));
        }

        // check for high score
        key = 'pyramid:highScore';
        let highScore = parseInt(localStorage.getItem(key), 10) || 0;
        if (score > highScore) {
          localStorage.setItem(key, score);
        }

        CardWaterfall.start(() => {
          reset();
          stackCards();
        });
      }

      // valid play, so break out of the loop checking other foundations
      return;
    }
  }

  // check cascades
  for (let i = 0; i < cascades.length; i += 1) {
    const cascade = cascades[i];

    if (grabbed.overlaps(cascade) && cascade.validPlay(card)) {
      const parent = cascade.lastCard;
      let points;

      // -15 points if moving from foundation back down to cascade
      // 5 points for moving from waste to cascade
      switch (card.stack.type) {
        case 'foundation':
          points = -15;
          break;
        case 'waste':
          points = 5;
          break;
        default:
          points = 0;
      }

      addToScore(points);

      undoStack.push({
        card,
        parent,
        oldParent: card.parent,
        points
      });

      grabbed.drop(parent);

      log(`dropping ${card} on cascade #${i}`);

      // valid play, so return out of the loop checking other cells
      return;
    }
  }

  // if we got this far, that means no valid move was made,
  // so the card(s) can go back to their original position
  log('invalid move; dropping card(s) on original position');

  grabbed.drop();
};

const onResize = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const aspectRatio = 4 / 3;

  // playable area, where cards will be drawn
  let tableauWidth;
  let tableauHeight;

  if (windowWidth / windowHeight > aspectRatio) {
    // wider than it is tall; use the window height to calculate tableau width
    tableauWidth = windowHeight * aspectRatio;
    tableauHeight = windowHeight;
  } else {
    // taller than it is wide; use window width to calculate tableau height
    tableauHeight = windowWidth / aspectRatio;
    tableauWidth = windowWidth;
  }

  const windowMargin = (windowWidth - tableauWidth) / 2;

  // tweak these values as necessary
  const margin = (7 / 609) * tableauWidth;

  // if tableau is 608pt wide, then for 8 columns
  // each column + margin should be 87

  // cards are 80x115
  const width = (80 / 609) * tableauWidth;
  const height = (115 / 454) * tableauHeight;
  const offset = height / 3.7; // ~31px
  const faceDownOffset = height / 10; // ~11px

  // enumerate over all cards/stacks in order to set their width/height
  for (const cascade of cascades) {
    cascade.size = { width, height };
    cascade.offset = offset;
  }

  for (const foundation of foundations) {
    foundation.size = { width, height };
  }

  for (const card of cards) {
    card.size = { width, height };
    card.offset = faceDownOffset;
  }

  for (const waste of wastes) {
    waste.size = { width, height };
  }

  talon.size = { width, height };

  grabbed.size = { width, height };
  grabbed.offset = offset;

  // Layout code
  const menu = document.querySelector('#menu');
  const status = document.querySelector('#status');

  // add internal padding to menu/status bars
  menu.style.padding = `0 0 0 ${windowMargin}px`;
  status.style.padding = `0 ${windowMargin + margin}px`;

  const top = margin + menu.offsetHeight;
  const left = windowMargin + margin / 2;

  talon.moveTo(windowWidth - windowMargin - margin / 2 - width, top);

  // wastes[0] is right next to the talon
  wastes.forEach((w, i) => {
    w.moveTo(talon.x - (margin + width) - (offset / 1.5 * i), top);
  });

  // foundations on the left
  foundations.forEach((f, i) => {
    f.moveTo(left + (width + margin) * i, top);
  });

  cascades.forEach((c, i) => {
    // allows space for foundations
    c.moveTo(windowMargin + margin / 2 + (width + margin) * i, top + height + margin)
  });

  // Handle resizing <canvas> for card waterfall
  CardWaterfall.onResize(windowWidth, windowHeight);

  // if in a "game over" state, cards are stacked on top of the talon, and
  // won't be moved along with it, because they are not attached
  if (gameOver) {
    cards.forEach(c => c.moveTo(talon.x, talon.y));
  }
};

const undo = () => {
  if (undoStack.length < 1) {
    log('No previously saved moves on the undo stack.');
    return;
  }

  const actuallyDoTheUndo = undoObject => {
    // get card state _before_ the most recent move
    const { card, parent, oldParent, flip, points } = undoObject;

    if (flip) {
      card.flip();
    }

    if (points) {
      // invert the point value
      addToScore(-points);
    }

    // some undo moves are only card flips
    if (!parent) {
      return;
    }

    // reverse the relationship; remove attachment from "new" parent
    parent.child = null;

    // we're cheating here and re-using logic from the `Grabbed` class
    // to handle moving/animating cards back to their previous position
    grabbed.grab(card);

    // total cheat
    grabbed.moved = true;

    grabbed.drop(oldParent);
  };

  const previous = undoStack.pop();

  if (Array.isArray(previous)) {
    // the objects are pushed on to the group in order, so to correctly
    // reverse, we need to reverse the list as well
    previous.reverse().forEach(actuallyDoTheUndo);
  } else {
    actuallyDoTheUndo(previous);
  }
};

const onKeyDown = e => {
  // return unless the keypress is meta/contrl + z (for undo)
  if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') {
    return;
  }

  undo();
};

const onDeal = async e => {
  e.preventDefault();

  // when game first loads, we don't need to confirm
  if (!firstGame && !confirm('New game?')) {
    return;
  }

  firstGame = false;

  reset();
  stackCards();
  // wait for a hot (milli)second for cards to be moved back to the talon
  await waitAsync(10);
  deal();
};

const onUndo = e => {
  e.preventDefault();

  if (gameOver) {
    return;
  }

  undo();
};

document.body.addEventListener('mousemove', onMove);
document.body.addEventListener('touchmove', onMove);
document.body.addEventListener('mouseup', onUp);
document.body.addEventListener('touchend', onUp);

window.addEventListener('resize', onResize);
window.addEventListener('keydown', onKeyDown);

const dealButton = document.querySelector('#deal_button');
const undoButton = document.querySelector('#undo_button');
const aboutButton = document.querySelector('#about_button');

dealButton.addEventListener('mouseup', onDeal);
undoButton.addEventListener('mouseup', onUndo);
aboutButton.addEventListener('mouseup', showAboutScreen);
// Mobile Safari seems to have some undocumented conditions that need
// to be met before it will fire `click` events, so we'll attach on touch events
dealButton.addEventListener('touchend', onDeal);
undoButton.addEventListener('touchend', onUndo);
aboutButton.addEventListener('touchend', showAboutScreen);

// start timer
window.setInterval(() => {
  if (gameOver) {
    return;
  }

  time += 1;
  document.querySelector('#time').textContent = `Time: ${time}`;
}, 1000);

// initial resize
onResize();

// stack cards in place
stackCards();
