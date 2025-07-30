const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const DEBUG = true;

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
// gets set every deal based on the radio button selected
let drawCount = parseInt(localStorage.getItem('pyramid:drawCount'), 10) || 3;

// 28 stacks for the pyramid
// 1 row at top, 7 rows at bottom, 7 total rows
const stacks = [];
for (let i = 0; i < 28; i += 1) {
  // temporarily adding a DOM element so we can see where these stacks are positioned
  const stack = new Stack();
  stack.index = i;  // custom property to track stack index
  stacks.push(stack);
}

// single foundation
const foundation = new Foundation();
// Make these visible by adding to DOM
document.body.append(foundation.element);

// still need multiple "wastes" to allow for 3 card draw
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

// need this to move cards to/from foundation
const grabbed = new Grabbed();

// With Pyramid, you don't drag/move cards, you click to select; if they add up to 13,
// they are moved to the foundation
const selected = [];

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

const addToScore = points => {
  score += points;

  const scoreElement = document.querySelector('#score');
  scoreElement.textContent = `Score: ${score}`;

  if (score < 0) {
    scoreElement.style.color = 'red';
  } else {
    scoreElement.style.color = 'black';
  }
};

// ensure all stacks no longer contain cards
const checkWin = () => !stacks.some(s => s.hasCards);

const moveToFoundation = async cards => {
  const undoGroup = [];

  cards.forEach(card => {
    const parent = foundation.lastCard;  // either a card or the foundation itself
    const points = 13;  // always get 13 points for playing on the foundation

    addToScore(points);

    undoGroup.push({
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

    log(`playing ${card} on foundation`);
  });

  undoStack.push(undoGroup);

  if (checkWin()) {
    gameOver = true;

    // increment games won counter
    let wonGames = parseInt(localStorage.getItem('pyramid:wonGames'), 10) || 0;
    localStorage.setItem('pyramid:wonGames', wonGames + 1);

    // check for high score
    let highScore = parseInt(localStorage.getItem('pyramid:highScore'), 10) || 0;
    if (score > highScore) {
      localStorage.setItem('pyramid:highScore', score);
    }

    // wait for animation to finish
    await waitAsync(250);

    CardWaterfall.start(() => {
      reset();
      stackCards();
    });
  }
};

const reset = () => {
  cards.forEach(c => {
    c.parent = null;
    c.child = null;
    c.flip('down');
    c.invert(false);
  });

  stacks.forEach(c => c.child = null);
  foundation.child = null
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
  // deal one face up card to each stack
  for (let i = 0; i < stacks.length; i += 1) {
    const card = talon.lastCard;
    const stack = stacks[i];
    const parent = stack.lastCard;

    card.setParent(parent);
    card.animateTo(parent.x, parent.y, 600);
    wait(200).then(() => card.zIndex = parent.zIndex + 1);
    card.flip();
    await waitAsync(75);
  }

  // increment games played counter
  const key = 'pyramid:playedGames';
  let playedGames = parseInt(localStorage.getItem(key), 10) || 0;
  localStorage.setItem(key, playedGames + 1);

  // set draw count
  drawCount = parseInt(localStorage.getItem('pyramid:drawCount'), 10) || 3;

  // change the base talon image from green "O" to red "X", etc.
  talon.drawCount = drawCount;

  gameOver = false;
};

const resetTalon = e => {
  e.preventDefault();

  // can only cycle talon _once_ with single card draw
  if (drawCount === 1) {
    return;
  }

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
  // TODO: still need this?
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

    const stack = card.stack;

    if (stack.type === 'talon') {

      // must have an array of multiple undo objects in the case of 3 card draw;
      // 3 cards must be moved back to the talon
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

      // now move card(s) from talon to waste(s)
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

    // don't allow cards in waste to be selected up if there are
    // cards in "higher" waste stacks
    if (stack.type === 'waste') {
      for (let i = wastes.length - 1; i >= 0; i -= 1) {
        if (wastes[i] === stack) {
          log(`no need to keep checking if cards are "above" clicked waste`);
          break;
        }

        if (wastes[i].hasCards) {
          log(`waste ${i} still has cards`);
          return;
        }
      }
    }

    log(`card index: ${card.stack.index}`);

    // only allow cards in lower rows to be selected if they are not covered by other cards
    // theoretical algorithm: add the number of cards in the row to the index; that card +1
    const child1 = stacks[stack.index + stack.row + 1];
    const child2 = stacks[stack.index + stack.row + 2];

    // allow a parent card to be selected if one of its child cards is selected
    // this condition is a bit hairy, which is why it is split out
    if (selected.length === 1 && (
        (!child1?.hasCards && child2?.lastCard === selected[0]) ||
        (!child2?.hasCards && child1?.lastCard === selected[0])
      )
  ) {
      // continue
    } else if (child1?.hasCards || child2?.hasCards) {
      // otherwise, don't allow selection if there are one or two child cards
      log(`can't pick up ${card}, ${[child1?.lastCard, child2?.lastCard]} are in the way`);
      return;
    }
    /*
            0
           1 2
          3 4 5
         6 7 8 9
       10 11 12 13
      14 15 16 17 18
     19 20 21 22 23 24
    25 26 27 28 29 30 31
    */

    // if card is already selected, remove it from the selected array
    if (selected.includes(card)) {
      const index = selected.indexOf(card);
      selected.splice(index, 1);
      card.invert(false);
      log(`deselecting ${card}`);
      return;
    } else if (selected.length === 1) {
      // don't allow a second card to be selected if they don't add up to 13
      const total = [...selected, card].reduce((acc, c) => {
        const value = RANKS.indexOf(c.rank) + 1;
        return acc + value;
      }, 0);

      if (total !== 13) {
        log(`can't select 2nd card; they only add up to ${total}`);
        return;
      }
    }

    // select card
    selected.push(card);
    card.invert(true);

    // check if cards add up to 13
    const total = selected.reduce((acc, c) => {
      const value = RANKS.indexOf(c.rank) + 1;
      return acc + value;
    }, 0);

    if (total === 13) {
      // move all selected cards to the foundation
      moveToFoundation(selected);
      selected.forEach(c => c.invert(false));
      selected.length = 0; // empty the array
    }
  };

  card.element.addEventListener('mousedown', onDown);
  card.element.addEventListener('touchstart', onDown);
});

const onResize = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const aspectRatio = 1; // trying out a square layout

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

  // make tableau size visible for layout testing
  if (false) {
    let tableauDebug = document.createElement('div');
    tableauDebug.style.width = `${tableauWidth}px`;
    tableauDebug.style.height = `${tableauHeight}px`;
    tableauDebug.style.backgroundColor = 'rgba(255, 0, 255, 0.5)';
    tableauDebug.style.position = 'absolute';
    tableauDebug.style.top = `0`;
    tableauDebug.style.left = `${windowMargin}px`;
    document.body.append(tableauDebug);
  }

  const widthInPixels = 600;
  const heightInPixels = 600;

  // set card sizes/margins here
  const margin = (6 / widthInPixels) * tableauWidth; // arbitrary horiztonal margin between cards (6px)
  const width = (80 / widthInPixels) * tableauWidth; // card width (80px)
  const height = (115 / heightInPixels) * tableauHeight; // card height (115px)
  const offset = (20 / heightInPixels) * tableauHeight; // arbitrary vertical diff between stacked cards

  // enumerate over all cards/stacks in order to set their width/height
  for (const stack of stacks) {
    stack.size = { width, height };
  }

  for (const card of cards) {
    card.size = { width, height };
  }

  for (const waste of wastes) {
    waste.size = { width, height };
  }

  // set width/height for single objects
  foundation.size = { width, height };
  talon.size = { width, height };
  grabbed.size = { width, height };

  // Layout code
  const menu = document.querySelector('#menu');
  const status = document.querySelector('#status');

  // add internal padding to menu/status bars
  menu.style.padding = `0 0 0 ${windowMargin}px`;
  status.style.padding = `0 ${windowMargin + margin}px`;

  // constants defining the drawable area in the tableau
  const top = menu.offsetHeight;
  const left = windowMargin;

  talon.moveTo(
    // right-most side of the screen, minus the extra horizontal window margin,
    // minus the size of the card, minus the small left/right card margin
    windowWidth - windowMargin - width - margin,
    top + margin
  );

  // wastes[0] is right next to the talon
  wastes.forEach((w, i) => {
    w.moveTo(talon.x - (margin + width) - (offset / 1.5 * i), top + margin);
  });

  // foundation on the left
  foundation.moveTo(left + margin, top + margin);

  // put stacks in a pyramid shape
  const center = left + (tableauWidth / 2) - (width / 2);

  let index = 0;
  // seven rows
  for (let row = 0; row < 7; row += 1) {
    // first row is 1 card, second row is 2 cards, etc.
    for (let column = 0; column <= row; column += 1) {

      log(`row ${row}, card ${column}, setting stack ${index}`);
      const stack = stacks[index];

      //set z-index so lower rows are on top
      stack.zIndex = row;

      // custom prop for row number;
      // same as z-index, but not as obtuse
      stack.row = row;

      // this is crazy
      stack.moveTo(
        center - (row * (width / 2 + margin / 2)) + (column * (width + margin)),
        top + (row * height / 2) + (row * offset / 2) + margin
      );

      index += 1;
    }
  }

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
