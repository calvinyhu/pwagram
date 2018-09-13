const CACHE_STATIC_NAME = 'static-v13';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];
const URL = 'https://httpbin.org/get';

isInArray = (string, array) => {
  array.forEaach(e => {
    if (string === e) return true;
  });
  return false;
};

self.addEventListener('install', event => {
  console.log('Installing service worker...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Activating service worker...', event);
  event.waitUntil(
    caches.keys().then(keysList => {
      return Promise.all(
        keysList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('Removing old cache', key);
            caches.delete(key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.indexOf(URL) > -1) cacheThenNetwork(event);
  else if (isInArray(event.request.url, STATIC_FILES))
    event.respondWith(caches.match(event.request));
  else cacheNetworkFallback(event);
});

cacheThenNetwork = event => {
  event.respondWith(
    caches.open(CACHE_DYNAMIC_NAME).then(cache => {
      return fetch(event.request).then(response => {
        cache.put(event.request, response.clone());
        return response;
      });
    })
  );
};

cacheNetworkFallback = event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      else {
        return fetch(event.request)
          .then(response => {
            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(event.request.url, response.clone());
              return response;
            });
          })
          .catch(error => {
            return caches.open(CACHE_STATIC_NAME).then(cache => {
              if (event.request.url.indexOf('/help'))
                return cache.match('/offline.html');
            });
          });
      }
    })
  );
};
