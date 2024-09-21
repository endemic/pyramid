self.addEventListener('install', e => {
  e.waitUntil(
      caches.open('freecell').then(cache => cache.addAll([
          '../stylesheets/main.css',
          '../index.html',
          '../about.html',

          '../images/other/cell.png',
          '../images/other/foundation.png',
          '../images/other/card-back.png',

          '../images/clubs/ace.png',
          '../images/clubs/two.png',
          '../images/clubs/three.png',
          '../images/clubs/four.png',
          '../images/clubs/five.png',
          '../images/clubs/six.png',
          '../images/clubs/seven.png',
          '../images/clubs/eight.png',
          '../images/clubs/nine.png',
          '../images/clubs/ten.png',
          '../images/clubs/jack.png',
          '../images/clubs/queen.png',
          '../images/clubs/king.png',

          '../images/spades/ace.png',
          '../images/spades/two.png',
          '../images/spades/three.png',
          '../images/spades/four.png',
          '../images/spades/five.png',
          '../images/spades/six.png',
          '../images/spades/seven.png',
          '../images/spades/eight.png',
          '../images/spades/nine.png',
          '../images/spades/ten.png',
          '../images/spades/jack.png',
          '../images/spades/queen.png',
          '../images/spades/king.png',

          '../images/hearts/ace.png',
          '../images/hearts/two.png',
          '../images/hearts/three.png',
          '../images/hearts/four.png',
          '../images/hearts/five.png',
          '../images/hearts/six.png',
          '../images/hearts/seven.png',
          '../images/hearts/eight.png',
          '../images/hearts/nine.png',
          '../images/hearts/ten.png',
          '../images/hearts/jack.png',
          '../images/hearts/queen.png',
          '../images/hearts/king.png',

          '../images/diamonds/ace.png',
          '../images/diamonds/two.png',
          '../images/diamonds/three.png',
          '../images/diamonds/four.png',
          '../images/diamonds/five.png',
          '../images/diamonds/six.png',
          '../images/diamonds/seven.png',
          '../images/diamonds/eight.png',
          '../images/diamonds/nine.png',
          '../images/diamonds/ten.png',
          '../images/diamonds/jack.png',
          '../images/diamonds/queen.png',
          '../images/diamonds/king.png',

          '../scripts/card-waterfall.js',
          '../scripts/card.js',
          '../scripts/cascade.js',
          '../scripts/cell.js',
          '../scripts/foundation.js',
          '../scripts/game.js',
          '../scripts/grabbed.js',
          '../scripts/ios-pwa-splash.js',
          // not necessary to cache the service worker script itself
          '../scripts/stack.js'
      ])),
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request)),
  );
});
