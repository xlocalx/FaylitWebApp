
// src/app/api/subscribe/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { addSubscription } from '@/lib/pushStore';

interface SubscriptionRequestBody {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json() as SubscriptionRequestBody;
    
    console.log('Received subscription on server:', subscription.endpoint);

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ error: 'Invalid subscription object received.' }, { status: 400 });
    }
    
    // Add to our very basic in-memory store
    addSubscription(subscription);

    // In a real app, you might want to send a confirmation push or just log success.
    // Example for sending a confirmation (requires web-push setup):
    /*
    const webPush = require('web-push'); // Dynamically require or ensure it's at top level if used
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      const payload = JSON.stringify({ title: 'Faylit Bildirimleri Aktif!', body: 'Artık bizden bildirim alacaksınız.' });
      try {
        await webPush.sendNotification(subscription, payload);
        console.log('Confirmation push sent.');
      } catch (pushError: any) {
        console.error('Error sending confirmation push:', pushError.statusCode, pushError.body);
      }
    }
    */

    return NextResponse.json({ message: 'Subscription received and stored successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save subscription.', details: errorMessage }, { status: 500 });
  }
}
