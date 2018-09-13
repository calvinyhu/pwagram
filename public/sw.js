// IMPORTANT:
// If you change ANYTHING in the service worker file, you need to close existing
// apps, and open a new tab. OR you check 'Update on reload' under Applications
// in developer tools so that it performs a hard reload.

// Service workers simply react to events.
// Service workers are kind of like network proxies at least if we use the
// 'fetch' event.

// Bump up the version number whenever any cached assets are changed
const CACHE_STATIC_NAME = 'static-v13';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js', // Only cache this for performance
  '/src/js/fetch.js', // Only cache this for performance
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

// Fired when browser installs the service worker
self.addEventListener('install', event => {
  console.log('Installing service worker...', event);
  // Access Cache API
  // caches.open() returns a Promise
  // the cache argument is a reference to the opened cache
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('Precaching App Shell');
      // Think about these as requests and NOT urls
      // add() and addAll() takes in url and automatically sends a
      // request and automically stores the response as a key-value
      // pair
      cache.addAll(STATIC_FILES);
    })
  );
});

// Fired after install, and if user closed all other old tabs
self.addEventListener('activate', event => {
  console.log('Activating service worker...', event);
  // Clean up old cache
  event.waitUntil(
    // caches.keys() will return an array of the names as strings of our caches
    caches.keys().then(keysList => {
      // Promise.all(waits for all promises)
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

// Cache, then network (best strategy)
// 1. Page directly access the cache, no service worker involved
// 1. Page sends network request that gets intercepted by the service worker
// 2. Page recieves cached data
// 2. Service worker reaches out to network
// 3. Service worker recieves data from network
// 4. (optional) Service worker stores fetched data in cache (dynamic caching)
// 5. Service worker returns fetched data to page

// The function is fired whenever the web app fetches somthing using the Fetch
// API
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
