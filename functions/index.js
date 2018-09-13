const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const serviceAccount = require('./pwagramu-key.json');
const webpush = require('web-push');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagramu.firebaseio.com'
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
      })
      .then(() => {
        webpush.setVapidDetails(
          'mailto:calvinhu9@gmail.com',
          'BLjwrIU6TGHidkN8mW-QK0xbjQV7LccSzhBB2ZYCATN39FWlfXpxAB_WHKIqNCYgng0BfeLfP2XnHRj3-VaAEuY',
          'JxRzfNsRtB7PNViO-VBN_JEf7Lhi7e86Gkb4YE4q9M0'
        );
        return admin
          .database()
          .ref('subscriptions')
          .once('value');
      })
      .then(subscriptions => {
        // sub = {endpoint: '', keys: {...}}
        subscriptions.forEach(sub => {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: 'New Post',
                content: 'New post added!',
                openUrl: '/help'
              })
            )
            .catch(error => {
              console.log(error);
            });
        });
        response
          .status(201)
          .json({ message: 'Data stored', id: request.body.id });
      })
      .catch(error => {
        response.status(500).json({ error: error });
      });
  });
});
