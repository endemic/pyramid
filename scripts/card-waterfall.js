const CardWaterfall = {
  fallingCard: null,
  canvas: document.querySelector('canvas'),

  start(callback) {
    // set callback function to run when waterfall is finished
    this.callback = callback || (() => {});

    // get the first card
    this.fallingCard = this.nextCard();

    // put canvas in front of DOM elements
    this.canvas.style.zIndex = 52;

    // need to permanently bind `this` in order to remove event listeners;
    // have to pass the exact same function reference to `removeEventListener`
    this.stop = this.stop.bind(this);

    // cancel animation on user interaction
    this.canvas.addEventListener('mouseup', this.stop);
    this.canvas.addEventListener('touchend', this.stop);

    // kick off animation loop
    this.interval = window.setInterval(() => this.update(), 16);
  },

  onResize(width, height) {
    // problem: changing canvas width will erase it, so we
    // need to copy previously-drawn data to resized canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(this.canvas, 0, 0);

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // multiply the "visible" width by devicePixelRatio to account for high DPI screens
    const scaledWidth = width * window.devicePixelRatio;
    const scaledHeight = height * window.devicePixelRatio;

    this.canvas.width = scaledWidth;
    this.canvas.height = scaledHeight;

    // could scale the image here by adding (scaledWidth, scaledHeight) as args
    // to `drawImage`, but it kinda looks janky
    this.canvas.getContext('2d').drawImage(tempCanvas, 0, 0);
  },

  get randomSign() {
    return Math.random() > 0.5 ? 1 : -1;
  },

  get randomVelocity() {
    const canvasWidth = parseInt(this.canvas.style.width, 10);
    const canvasHeight = parseInt(this.canvas.style.height, 10);

    let x = canvasWidth * 0.003;
    let y = canvasHeight * 0.005;

    let v = {
      x: ((Math.random() * x) + x) * this.randomSign,
      y: ((Math.random() * y) + y) * -1
    };

    log(v);

    return v;
  },

  nextCard() {
    // randomly choose foundation & pick top card off it
    let randomFoundationIndex = Math.floor(Math.random() * foundations.length);
    let f = foundations[randomFoundationIndex];

    while (!f.hasCards) {
      randomFoundationIndex = Math.floor(Math.random() * foundations.length);
      f = foundations[randomFoundationIndex];

      // if no more cards left, return a falsy value
      if (!this.hasCards) {
        return;
      }
    }

    let card = f.lastCard;

    // detatch card
    card.parent.child = null;
    card.parent = null;

    // give random speed; `card` is an Object, so can assign arbitrary properties
    card.velocity = this.randomVelocity;

    return card;
  },

  update() {
    const canvasWidth = parseInt(this.canvas.style.width, 10);
    const canvasHeight = parseInt(this.canvas.style.height, 10);
    const context = this.canvas.getContext('2d');

    // pick next card if the existing one goes off screen
    if (this.fallingCard.x + this.fallingCard.width < 0 || this.fallingCard.x > canvasWidth) {
      this.fallingCard = this.nextCard();
    }

    let fallingCard = this.fallingCard;

    // If we can't get the next card, that means we're out
    if (!fallingCard) {
      this.stop();

      return;
    }

    const scale = window.devicePixelRatio;

    context.drawImage(fallingCard.element.children[0],
      fallingCard.x * scale, fallingCard.y * scale,
      fallingCard.width * scale, fallingCard.height * scale);

    const nextPosition = {
      x: fallingCard.x + fallingCard.velocity.x,
      y: fallingCard.y + fallingCard.velocity.y
    };

    // don't let the card go below the bottom edge of the screen
    if (nextPosition.y + fallingCard.height > canvasHeight) {
      nextPosition.y = canvasHeight - fallingCard.height;

      // "bounce" the card
      fallingCard.velocity.y = -fallingCard.velocity.y * 0.85;
    }

    // Move card DOM element
    fallingCard.moveTo(nextPosition.x, nextPosition.y);

    // update card velocity w/ "gravity" acceleration
    fallingCard.velocity.y += canvasHeight * 0.001; // 0.1%
  },

  get hasCards() {
    return foundations.some(f => f.hasCards);
  },

  stop() {
    // stop listening for interaction
    this.canvas.removeEventListener('mouseup', this.stop);
    this.canvas.removeEventListener('touchend', this.stop);

    // stop animation loop
    window.clearInterval(this.interval);

    // put canvas back "behind" DOM elements
    this.canvas.style.zIndex = 0;

    // erase drawn card trails
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    log('running waterfall callback');
    this.callback();
  }
};
