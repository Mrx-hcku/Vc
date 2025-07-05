// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDxTN6oRxNKUAJ0eVUZucumAALeBBG72hk",
  authDomain: "vcall-5f220.firebaseapp.com",
  projectId: "vcall-5f220",
  messagingSenderId: "679349443110",
  appId: "1:679349443110:web:b44818bb14dffafcec24e7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: payload.data
  });
});
