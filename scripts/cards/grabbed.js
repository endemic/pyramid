class Grabbed extends Stack {
  type = 'grabbed';

  // record the offset where the card was picked up,
  // so clicking/touching the card doesn't cause it to "jump"
  pointerOffset = { x: 0, y: 0 };

  // ivars to tell us whether the user clicked
  // and moved cards far enough to actually show movement
  origin = { x: 0, y: 0 };
  moved = false;

  setOffset(point) {
    const card = this.child;

    this.origin = point;

    this.pointerOffset.x = point.x - card.x;
    this.pointerOffset.y = point.y - card.y;

    // sets the internal position representation, so it's not (0, 0)
    this.x = point.x - this.pointerOffset.x;
    this.y = point.y - this.pointerOffset.y;
  }

  moveTo(point) {
    // only move if distance is > some small wiggle room
    // to allow for easier double-click to play
    let d = dist(point, this.origin);
    if (d < 5) {
      log(`didn't move enough: ${d}`);
      return;
    }

    this.moved = true;
    document.body.style.cursor = 'grabbing';

    this.x = point.x - this.pointerOffset.x;
    this.y = point.y - this.pointerOffset.y;

    if (!this.child) {
      return;
    }

    // move child cards
    let offset = 0;
    for (let card of this.children()) {
      card.moveTo(this.x, this.y + offset);
      offset += this.offset;
    }
  }

  async animateTo(point) {
    if (!this.child) {
      return;
    }

    // animate child cards
    let offset = 0;
    // don't need to offset when dropping back on the talon/waste
    let noOffset = ['talon', 'waste'].indexOf(this.child.stack.type) > -1;

    for (let card of this.children()) {
      card.animateTo(point.x, point.y + offset);

      await waitAsync(50);

      offset += noOffset ? 0 : this.offset;
    }
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

    log(`setting ${this.type} size: ${width}, ${height}`);
  }

  // returns true if the "grabbed" bounding box overlaps
  // the passed arg bounding box
  overlaps(target) {
    // Calculate the sides of the boxes
    let left1 = target.x;
    let right1 = target.x + target.size.width;
    let top1 = target.y;
    let bottom1 = target.y + target.size.height;

    // make AABB slightly narrower for less aggressive collision detection
    let margin = this.size.width / 6;

    let left2 = this.x + margin;
    let right2 = this.x + this.size.width - margin;
    let top2 = this.y;
    let bottom2 = this.y + this.size.height;

    if (bottom1 < top2 || top1 > bottom2 || right1 < left2 || left1 > right2) {
      return false;
    }

    return true;
  }

  // sets the `child` prop of the `grabbed` object, and adjusts each card's z-index
  grab(card) {
    this.child = card;

    let index = 52; // highest possible z-index for a 52 card deck
    for (let card of this.children()) {
      log(`setting z-index of grabbed card ${card} to be ${index}`);
      card.zIndex = index;
      index += 1;
    }
  }

  // Drop a series of cards on a target, setting the parent/etc. property, and animating them in place
  drop(target) {
    const card = this.child;
    // if no explicit target, assume we're dropping back
    // on the original parent
    target = target || card.parent;

    console.log(`dropping on ${target}`);

    card.setParent(target);

    if (this.moved) {
      let offset = this.offset;

      // we don't have to show as much of face down cards
      if (target.type === 'card' && !target.faceUp) {
        offset = target.offset;
      }

      // Don't add card overlap if dropping on an empty cascade
      if (['cascade'].includes(target.type)) {
        offset = 0;
      }

      // don't add card overlap on foundations, waste, or talon; note that we use
      // "stack.type" here since cards can stack up on these targets
      if (['foundation', 'waste', 'talon'].includes(target.stack.type)) {
        offset = 0;
      }

      this.animateTo({
        x: target.x,
        y: target.y + offset
      });

      // the `wait` allows for the cards to finish animating so they don't
      // ease underneath neighboring cards
      // TODO: theoretically this needs to wait an additional 50ms for each card in the stack
      wait(250).then(() => card.resetZIndex());
    } else {
      // if card hasn't moved at all, we can just reset the z-index
      card.resetZIndex();
    }

    this.child = null;
    this.moved = false;

    document.body.style.cursor = 'grab';
  }
}
