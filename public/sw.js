importScripts('/src/js/idb.js');

const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
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
const URL = 'https://pwagramu.firebaseio.com/posts';

const dbPromise = idb.open('posts-store', 1, db => {
  if (!db.objectStoreNames.contains('posts'))
    db.createObjectStore('posts', { keyPath: 'id' });
});

trimCache = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    return cache.keys().then(keys => {
      if (keys.length > maxItems)
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
    });
  });
};

isInArray = (string, array) => {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    // console.log('matched ', string);
    // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    cachePath = string.substring(self.origin.length);
  } else cachePath = string; // store the full request (for CDNs)
  return array.indexOf(cachePath) > -1;
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
    fetch(event.request).then(response => {
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        for (let key in data) {
          dbPromise.then(db => {
            const tx = db.transaction('posts', 'readwrite');
            const store = tx.objectStore('posts');
            store.put(data[key]);
            return tx.complete;
          });
        }
      });
      return response;
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
              if (event.request.headers.get('accept').includes('text/html'))
                return cache.match('/offline.html');
            });
          });
      }
    })
  );
};
