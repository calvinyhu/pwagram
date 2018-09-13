// Check if browser supports Promises, if it doesn't add the polyfill for it
if (!window.Promise) {
  window.Promise = Promise;
}

let deferredPrompt = null;

// Check if browser supports service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('Service worker registered!');
    })
    .catch(error => {
      console.log(error);
    });
}

window.addEventListener('beforeinstallprompt', event => {
  // Prevent chrome from showing the banner
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});
