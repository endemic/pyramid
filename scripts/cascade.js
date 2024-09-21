class Cascade extends Stack {
  type = 'cascade';

  get size() {
    if (!this.hasCards) {
      return {
        width: this.width,
        height: this.height
      };
    }

    const width = this.width; // all cards are the same width
    let height = this.height;

    // first card completely overlaps the cascade,
    // so we don't use its height value
    let card = this.child;

    // Not actually using any data from child cards,
    // just enumerating over them to determine height
    for (let c of card.children()) {
      height += this.offset;
    }

    return { width, height };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    log(`setting ${this.type} size: ${width}, ${height}`);
  }

  validPlay (card) {
    const lastCard = this.lastCard;

    // if no other cards in the cascade, only kings are allowed
    if (!lastCard.parent && card.rank === 'king') {
      return true;
    }

    // if there are cards already played, ensure they are
    // alternating suits and the card rank is one lower than
    // the last card (and the last card has to be face up, too)
    if (card.color !== lastCard.color && card.diff(lastCard) === -1 && lastCard.faceUp) {
      return true;
    }

    // your situation is unfortunate!
    return false;
  }
}
