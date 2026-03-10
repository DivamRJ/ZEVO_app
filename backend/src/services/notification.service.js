const env = require('../config/env');
const { eventBus, EVENTS } = require('../events/event-bus');

async function sendOwnerNotification(payload) {
  if (env.ownerNotificationWebhookUrl) {
    await fetch(env.ownerNotificationWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return;
  }

  // Mock webhook fallback for local development.
  console.log('[MockOwnerNotificationWebhook]', JSON.stringify(payload));
}

function registerOwnerNotificationListener() {
  eventBus.on(EVENTS.BOOKING_CONFIRMED, async (eventPayload) => {
    try {
      await sendOwnerNotification({
        type: 'BOOKING_CONFIRMED',
        emittedAt: new Date().toISOString(),
        data: eventPayload
      });
    } catch (error) {
      console.error('Failed to send owner notification:', error);
    }
  });
}

function emitBookingConfirmed(eventPayload) {
  eventBus.emit(EVENTS.BOOKING_CONFIRMED, eventPayload);
}

module.exports = {
  registerOwnerNotificationListener,
  emitBookingConfirmed
};
