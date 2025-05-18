
// src/lib/pushStore.ts
// THIS IS A VERY BASIC IN-MEMORY STORE FOR DEMONSTRATION.
// DO NOT USE IN PRODUCTION. USE A PROPER DATABASE.

// Define an interface that includes the 'endpoint' property, which is part of PushSubscriptionJSON
interface PushSubscriptionWithEndpoint extends PushSubscriptionJSON {
  endpoint: string;
  // You might need to explicitly define other properties from PushSubscriptionJSON if TypeScript complains
  // keys?: { p256dh: string; auth: string; };
}

let subscriptions: PushSubscriptionWithEndpoint[] = [];

export function addSubscription(subscription: PushSubscriptionWithEndpoint) {
  const existingSubscription = subscriptions.find(sub => sub.endpoint === subscription.endpoint);
  if (!existingSubscription) {
    subscriptions.push(subscription);
    console.log('Subscription added to in-memory store:', subscription.endpoint);
  } else {
    console.log('Subscription already in in-memory store:', subscription.endpoint);
  }
}

export function getSubscriptions(): PushSubscriptionWithEndpoint[] {
  return [...subscriptions]; // Return a copy
}

export function removeSubscription(endpoint: string) {
  const initialLength = subscriptions.length;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  if (subscriptions.length < initialLength) {
    console.log('Subscription removed from in-memory store:', endpoint);
  }
}

export function clearAllSubscriptions() {
  subscriptions = [];
  console.log('All subscriptions cleared from in-memory store.');
}
