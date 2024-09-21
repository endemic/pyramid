const wait = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const waitAsync = async ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getPoint = event => {
  if (event.changedTouches && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
  }

  return {
    x: event.x,
    y: event.y
  };
}

const log = (...params) => {
  if (DEBUG) {
    console.log(...params);
  }
};
