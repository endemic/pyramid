class Card {
  faceUp = false;

  suit = null;
  rank = null;

  allRanks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];

  parent = null;
  child = null;

  // created/assigned in constructor; represents DOM element
  element = null;

  // position variables
  x = 0;
  y = 0;

  // sizing variables; dynamically set by `onResize`
  width = null;
  height = null;

  // when positioning child cards, this is how far they overlap; dynamically set by `onResize`
  offset = null;

  // flag whether or not a card is moving around
  animating = false;

  // this value changes depending on where the card is dropped;
  // it affects behavior when card is clicked/dragged
  location = null;

  type = 'card';

  constructor(suit, rank) {
    // dynamically create DOM tree representing a card
    // the child elements need to be <img> tags, so that we can use the image
    // data to draw to a canvas background
    /*
      <div class="card">
        <img class="front">
        <img class="back">
      </div>
    */
   this.suit = suit;
   this.rank = rank;

   this.element = document.createElement('div');
   this.element.classList.add('card');
   this.element.classList.add(this.rank);
   this.element.classList.add(this.suit);

   const front = document.createElement('img');
   front.src = `images/${this.suit}/${this.rank}.png`;
   front.classList.add('front');

   const back = document.createElement('img');
   back.src = `images/other/card-back.png`;
   back.classList.add('back');

   this.element.append(front, back);

   // needs to be face-down by default
  }

  toString() {
    return `${this.rank} ${this.suit}`;
  }

  get hasCards() {
    return this.child !== null;
  }

  // generator to easily loop thru all child cards
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
  *children() {
    let card = this.child;

    while (card) {
      yield card;
      card = card.child;
    }
  }

  get stack() {
    let parent = this.parent;

    while (parent.parent) {
      parent = parent.parent;
    }

    return parent;
  }

  get childCount() {
    let count = 0;
    for (let _card of this.children()) {
      count += 1;
    }
    return count;
  }

  addChild(card) {
    // remove old parent's reference to card, if necessary
    if (card.parent) {
      card.parent.child = null;
    }

    this.child = card;
    card.parent = this;
  }

  setParent(newParent) {
    // remove old parent's reference to this card, if necessary
    if (this.parent) {
      this.parent.child = null;
    }

    newParent.child = this;
    this.parent = newParent;
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    this.element.style.transition = 'translate 0ms linear';
    this.element.style.translate = `${this.x}px ${this.y}px 0px`;
  }

  animateTo(x, y, duration) {
    this.x = x;
    this.y = y;

    this.animating = true;
    duration ||= 300;

    // https://www.cssportal.com/css-cubic-bezier-generator/
    this.element.style.transition = `translate ${duration}ms cubic-bezier( 0.175, 0.885, 0.32, 1.275 )`;
    this.element.style.translate = `${this.x}px ${this.y}px 0px`;

    wait(duration).then(() => this.animating = false);
  }

  flip(direction) {
    let duration = 300;

    // if `direction` is not set, then the effect is toggled
    if (direction === 'up') {
      this.faceUp = false;
      duration = 0;
    } else if (direction === 'down') {
      this.faceUp = true;
      duration = 0;
    }

    // set animation duration
    this.element.children[0].style.transition = `transform ${duration}ms`; // front
    this.element.children[1].style.transition = `transform ${duration}ms`; // front

    // timing for this flip transition is defined in CSS
    if (this.faceUp) {
      this.element.children[0].style.transform = 'rotateY(180deg)';   // front
      this.element.children[1].style.transform = 'rotateY(0deg)'; // back
    } else {
      this.element.children[0].style.transform = 'rotateY(0deg)'; // front
      this.element.children[1].style.transform = 'rotateY(-180deg)';    // back
    }

    this.faceUp = !this.faceUp;
  }

  invert(value) {
    this.element.style.filter = `invert(${value ? 1 : 0})`;
  }

  invertMovableCards(cardCount) {
    let invert = false;
    let invertedParentCard = null;

    for (let c of this.children()) {
      if (!invert && c.childCount < cardCount && c.childrenInSequence) {
        invert = true;
        invertedParentCard = c;
      }

      if (invert) {
        c.invert(true)
      }
    }

    return invertedParentCard;
  }

  resetInvert() {
    this.invert(false);

    for (let c of this.children()) {
      c.invert(false);
    }

  }

  flash() {
    this.element.style.animation = 'burst 250ms';
    wait(250).then(() => this.element.style.animation = '');
  }

  get size () {
    return {
      width: this.width,
      height: this.height
    };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    log(`setting card size: ${width}, ${height}`);

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
  }

  get color() {
    if (this.suit === 'hearts' || this.suit === 'diamonds') {
      return 'red';
    }

    return 'black';
  }

  set zIndex(index) {
    this.element.style.zIndex = index;
  }

  get zIndex() {
    return parseInt(this.element.style.zIndex, 10);
  }

  resetZIndex() {
    // update z-index to be above parent
    let index = this.parent.zIndex + 1;
    this.zIndex = index;

    // and on all subsequent cards
    for (let card of this.children()) {
      index += 1;
      card.zIndex = index;
    }
  }

  // returns this - b; e.g. 5 - 2 = 3
  // used to ensure sequential card placement
  diff(b) {
    return this.allRanks.indexOf(this.rank) - this.allRanks.indexOf(b.rank);
  }

  get childrenInSequence() {
    // if no children, there's a sequence by default
    if (!this.child) {
      return true;
    }

    // if card is same color as previous, or the rank difference is greater than 1,
    // then the subsequent cards are not in sequence
    for (let card of this.children()) {
      if (card.parent.color === card.color || card.diff(card.parent) !== -1) {
        return false;
      }
    }

    return true;
  }
}
