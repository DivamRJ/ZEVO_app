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

async function sendBookingConfirmedEmail(payload) {
  if (!env.resendApiKey) {
    return;
  }

  const recipientEmail = payload.ownerEmail || env.zevoBookingsEmail;

  if (!recipientEmail) {
    return;
  }

  const html = `
    <h2>New ZEVO Booking Confirmed</h2>
    <p><strong>Owner:</strong> ${payload.ownerName || 'Turf Owner'}</p>
    <p><strong>Turf:</strong> ${payload.turfName || payload.turfLocation || payload.turfId}</p>
    <p><strong>Location:</strong> ${payload.turfLocation || 'N/A'}</p>
    <p><strong>Player:</strong> ${payload.userEmail || payload.userId}</p>
    <p><strong>Start (UTC):</strong> ${payload.startTime}</p>
    <p><strong>End (UTC):</strong> ${payload.endTime}</p>
    <p><strong>Total Price:</strong> Rs. ${payload.totalPrice}</p>
    <p><strong>Booking ID:</strong> ${payload.bookingId}</p>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.resendApiKey}`
    },
    body: JSON.stringify({
      from: env.zevoFromEmail,
      to: [recipientEmail],
      subject: `ZEVO Booking Confirmed: ${payload.turfName || payload.turfLocation || payload.turfId}`,
      html
    })
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text();
    throw new Error(`Resend error: ${errorBody}`);
  }
}

function registerOwnerNotificationListener() {
  eventBus.on(EVENTS.BOOKING_CONFIRMED, async (eventPayload) => {
    try {
      await sendOwnerNotification({
        type: 'BOOKING_CONFIRMED',
        emittedAt: new Date().toISOString(),
        data: eventPayload
      });
      await sendBookingConfirmedEmail(eventPayload);
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
