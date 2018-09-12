// IMPORTANT:
// If you change ANYTHING in the service worker file, you need to close existing
// apps, and open a new tab. OR you check 'Update on reload' under Applications 
// in developer tools so that it performs a hard reload.

// Service workers simply react to events.
// Service workers are kind of like network proxies at least if we use the 
// 'fetch' event.

// Bump up the version number whenever any cached assets are changed
const CACHE_STATIC_NAME = 'static-v4'
const CACHE_DYNAMIC_NAME = 'dynamic-v2'

// Fired when browser installs the service worker
self.addEventListener('install', (event) => {
  console.log('Installing service worker...', event)
  // Access Cache API
  // caches.open() returns a Promise
  // the cache argument is a reference to the opened cache
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log('Precaching App Shell')
        // Think about these as requests and NOT urls
        // add() and addAll() takes in url and automatically sends a 
        // request and automically stores the response as a key-value
        // pair
        cache.addAll([
          '/',
          '/index.html',
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
        ])
      })
  )
})

// Fired after install, and if user closed all other old tabs
self.addEventListener('activate', (event) => {
  console.log('Activating service worker...', event)
  // Clean up old cache
  event.waitUntil(
    // caches.keys() will return an array of the names as strings of our caches
    caches.keys()
      .then(keysList => {
        // Promise.all(waits for all promises)
        return Promise.all(keysList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('Removing old cache', key)
            // caches.delete(key) returns a promise
            return caches.delete(key)
          }
        }))
      })
  )
  return self.clients.claim()
})

// The function is fired whenever the web app fetches somthing using the Fetch 
// API
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Get response from cache if it exists, otherwise get it from 
        // the network
        if (response)
          return response
        else
          return fetch(event.request)
            .then(response => {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(cache => {
                  // put() requires you to put a key-value pair 
                  // manually
                  // Can only consume the response once, so we
                  // need to use clone()
                  cache.put(event.request.url, response.clone())
                  return response
                })
            }).catch(error => {
            })
      })
  )
})
