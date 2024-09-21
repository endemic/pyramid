class Talon extends Stack {
  type = 'talon';

  offset = 0;

  constructor() {
    super();

    this.element = document.createElement('img');
    this.element.classList.add('talon');
    this.element.src = 'images/other/talon.png';
  }

  get size() {
    return {
      width: this.width,
      height: this.height
    };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;

    console.log(`setting ${this.type} size: ${width}, ${height}`);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    this.element.style.transition = 'translate 0ms linear';
    this.element.style.translate = `${this.x}px ${this.y}px 0px`;

    for (let card of this.children()) {
      card.moveTo(this.x, this.y);
    }
  }

  // debug method to check order of cards
  get printCards() {
    for (let card of this.children()) {
      console.log(card.toString());
    }
  }
}
