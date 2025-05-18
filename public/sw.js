
// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Perform install steps if any (e.g., caching assets)
  // self.skipWaiting(); // Optional: forces the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Perform activate steps if any (e.g., cleaning up old caches)
  // event.waitUntil(clients.claim()); // Optional: allows an active service worker to set itself as the controller for all clients within its scope
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  
  let pushData = { title: 'Yeni Bildirim', body: 'Faylit\'ten yeni bir mesajınız var!' };
  if (event.data) {
    try {
      const data = event.data.json();
      pushData.title = data.title || pushData.title;
      pushData.body = data.body || pushData.body;
      // You can also include icon, image, actions, etc. as properties in data
      // pushData.icon = data.icon; 
      // pushData.actions = data.actions;
      // pushData.data = data.data; // For click action
    } catch (e) {
      console.log('Push data is not JSON, using text content as body.');
      pushData.body = event.data.text();
    }
  } else {
    console.log('Push event did not have data.');
  }


  const options = {
    body: pushData.body,
    icon: '/favicon.ico', // Replace with a proper notification icon if available
    badge: '/favicon.ico', // For Android
    // Example actions:
    // actions: [
    //   { action: 'explore', title: 'Keşfet', icon: '/icons/explore.png' },
    //   { action: 'close', title: 'Kapat', icon: '/icons/close.png' },
    // ],
    // data: pushData.data || { url: '/' } // Custom data to pass to notification click event
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click Received.');
  event.notification.close();

  // Example: Open a URL when notification is clicked
  // const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  
  // For now, just focus or open the main app page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url === self.registration.scope && 'focus' in client) { 
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope); 
      }
    })
  );
});
