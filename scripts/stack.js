class Stack {
  type = 'stack';

  child = null;

  // position/size values are set externally by
  // a method that inspects viewport dimensions
  x = 0;
  y = 0;

  width = null;
  height = null;

  element = null;

  zIndex = 0;

  // dynamically set by `Game.onResize`
  offset = null;

  get stack() {
    return this;
  }

  get hasCards() {
    return this.child !== null;
  }

  get cardCount() {
    let count = 0;

    for (let _card of this.children()) {
      count += 1;
    }

    return count;
  }

  get lastCard() {
    let last = this;

    while (last?.child) {
      last = last.child;
    }

    return last;
  }

  toString() {
    return `${this.type} stack`;
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

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    // if a visible component in the DOM exists, move it
    if (this.element) {
      this.element.style.transition = 'translate 0ms linear';
      this.element.style.translate = `${this.x}px ${this.y}px 0px`;
    }

    let offset = 0;
    // move child cards
    for (let card of this.children()) {
      card.moveTo(this.x, this.y + offset);
      // face up cards need more viewable area
      offset += card.faceUp ? this.offset : card.offset;
    }
  }

  get size() {
    let height = this.height;
    let width = this.width;

    // this is janky -- need to omit the first card, as it will
    // perfectly overlap the stack
    let cardCount = 0;

    // determine height of stack + all cascading cards
    for (let card of this.children()) {
      // if cards in stacks are still face down, draw them closer together
      let offset = card.faceUp ? this.offset : this.offset / 4;

      if (cardCount > 0) {
        height += offset;
      }

      cardCount += 1;
    }

    return { width, height };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;

    log(`setting ${this.type} size: ${width}, ${height}`);
  }


  contains(point) {
    return point.x > this.x &&
        point.x < this.x + this.width &&
        point.y > this.y &&
        point.y < this.y + this.height;
  }

  // increment all z-indices for cards in this stack
  // such that they overlap correctly
  resetZIndex() {
    let index = 0;

    for (let card of this.children()) {
      card.zIndex = index;
      index += 1;
    }
  }
}
