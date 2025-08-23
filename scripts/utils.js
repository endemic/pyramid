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

const dialog = {
  init: () => {
    const element = document.querySelector('dialog#confirm');
    element.addEventListener('close', () => {
      if (element.returnValue !== 'yes') {
        // user clicked outside the dialog or pressed escape
        return;
      }
      dialog.onConfirm();
    });
  },
  onConfirm: () => {
    // default no-op
  },
  show: (message, onConfirmFunction) => {
    const element = document.querySelector('dialog#confirm');
    element.querySelector('#dialog-text').textContent = message;
    element.showModal();

    if (typeof onConfirmFunction === 'function') {
      dialog.onConfirm = onConfirmFunction;
    }
  },

  close: () => {
    document.querySelector('dialog#confirm').close();
  }
};

dialog.init();
