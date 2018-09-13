importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

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

// Fired whenever service worker regains internet connection
self.addEventListener('sync', event => {
  console.log('Background syncing', event);

  // Handling different tags
  switch (event.tag) {
    case 'sync-new-posts':
      console.log('Syncing new posts');
      event.waitUntil(
        readAllData('sync-posts').then(data => {
          for (let dt of data) sendData(dt);
        })
      );
  }
});

sendData = data => {
  fetch('https://us-central1-pwagramu.cloudfunctions.net/storePostData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      id: data.id,
      title: data.title,
      location: data.location,
      image:
        'https://firebasestorage.googleapis.com/v0/b/pwagramu.appspot.com/o/sf-boat.jpg?alt=media&token=0da3007e-9ca4-4bd2-9e8e-47f85d4e64ec'
    })
  })
    .then(response => {
      console.log('Sent data on reconnection', response);
      if (response.ok) {
        response.json().then(resData => {
          deleteItemFromData('sync-posts', resData.id);
        });
      }
    })
    .catch(error => {
      console.log('Error while sending data on reconnection', error);
    });
};

cacheThenNetwork = event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const clonedResponse = response.clone();
      clearAllData('posts')
        .then(() => {
          return clonedResponse.json();
        })
        .then(data => {
          for (let key in data) writeData('posts', data[key]);
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
