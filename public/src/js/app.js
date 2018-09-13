// Check if browser supports Promises, if it doesn't add the polyfill for it
if (!window.Promise) {
  window.Promise = Promise;
}

let deferredPrompt = null;
const enableNotificationsButtons = document.querySelectorAll(
  '.enable-notifications'
);

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

displayConfirmNotification = () => {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You succesfully subscribed to our notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm',
          title: 'Okay',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'Cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };
    navigator.serviceWorker.ready.then(swreg => {
      swreg.showNotification('Successfully subscribed! (from SW)', options);
    });
  }
};

configurePushSub = () => {
  if (!('serviceWorker' in navigator)) return;
  let reg = null;
  navigator.serviceWorker.ready
    .then(swreg => {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(sub => {
      if (sub === null) {
        // create new subscription
        const vapidPublicKey =
          'BLjwrIU6TGHidkN8mW-QK0xbjQV7LccSzhBB2ZYCATN39FWlfXpxAB_WHKIqNCYgng0BfeLfP2XnHRj3-VaAEuY';
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // use existing subscription
      }
    })
    .then(newSub => {
      return fetch('https://pwagramu.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(newSub)
      });
    })
    .then(res => {
      if (res.ok) displayConfirmNotification();
    })
    .catch(error => {
      console.log(error);
    });
};

askForNotificationPermission = () => {
  Notification.requestPermission(result => {
    console.log('User choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted');
    } else {
      configurePushSub();
      // displayConfirmNotification();
    }
  });
};

if ('Notification' in window && 'serviceWorker' in navigator) {
  enableNotificationsButtons.forEach(button => {
    button.style.display = 'inline-block';
    button.addEventListener('click', askForNotificationPermission);
  });
}
