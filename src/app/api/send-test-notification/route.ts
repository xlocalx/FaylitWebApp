
// src/app/api/send-test-notification/route.ts
import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { getSubscriptions, removeSubscription } from '@/lib/pushStore';

export async function POST() { // Using POST for this action
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('VAPID keys are not set on the server. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT environment variables.');
    return NextResponse.json({ error: 'VAPID keys not configured on server.' }, { status: 500 });
  }

  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  const currentSubscriptions = getSubscriptions();
  if (currentSubscriptions.length === 0) {
    return NextResponse.json({ message: 'No subscriptions to send notifications to.' });
  }

  console.log(`Attempting to send notifications to ${currentSubscriptions.length} subscribers.`);

  const notificationPayload = JSON.stringify({
    title: '✨ Faylit Test Bildirimi! ✨',
    body: 'Bu, Faylit uygulamasından gönderilen bir test bildirimidir. Harika fırsatlar için takipte kalın!',
    // icon: '/icons/notification-icon.png', // optional custom icon
    // data: { url: '/indirim' } // optional: pass data for notification click action
  });

  const sendPromises = currentSubscriptions.map(sub =>
    webPush.sendNotification(sub, notificationPayload)
      .then(response => {
        console.log(`Notification sent successfully to ${sub.endpoint.substring(0,30)}... Status: ${response.statusCode}`);
      })
      .catch(err => {
        console.error(`Error sending notification to ${sub.endpoint.substring(0,30)}... Status Code: ${err.statusCode}`);
        // console.error('Error body:', err.body); // Contains more details
        // If 404 (Not Found) or 410 (Gone), the subscription is no longer valid and should be removed.
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Subscription expired or invalidated, removing:', sub.endpoint);
          removeSubscription(sub.endpoint); // Remove from our in-memory store
        }
      })
  );

  try {
    await Promise.all(sendPromises);
    const remainingSubscriptions = getSubscriptions(); // Get updated list
    return NextResponse.json({ 
      message: `Notifications processed. Initial: ${currentSubscriptions.length}, Remaining: ${remainingSubscriptions.length}. Check server logs for details.` 
    });
  } catch (error) {
    // This catch might not be strictly necessary if individual errors are caught above,
    // but good for overall Promise.all failure.
    console.error('Failed to process all notifications:', error);
    return NextResponse.json({ error: 'Failed to send some notifications. See server logs.' }, { status: 500 });
  }
}

// You could add a GET handler for testing purposes if needed, e.g., to clear subscriptions.
// export async function GET() {
//   clearAllSubscriptions();
//   return NextResponse.json({ message: 'All subscriptions cleared (for testing).' });
// }
