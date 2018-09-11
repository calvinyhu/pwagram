// IMPORTANT:
// If you change ANYTHING in the service worker file, you need to close existing
// apps, and open a new tab. OR you check 'Update on reload' under Applications 
// in developer tools so that it performs a hard reload.

// Service workers simply react to events.
// Service workers are kind of like network proxies at least if we use the 
// 'fetch' event.

// Fired when browser installs the service worker
self.addEventListener('install', (event) => {
    console.log('Installing service worker...', event)
})

// Fired after install
self.addEventListener('activate', (event) => {
    console.log('Activating service worker...', event)
    return self.clients.claim()
})

// The function is fired whenever the web app fetches somthing using the Fetch 
// API
self.addEventListener('fetch', (event) => {
    console.log('Fetching something...', event)
    event.respondWith(fetch(event.request))
})
