const EventEmitter = require('events');

class ZevoEventBus extends EventEmitter {}

const eventBus = new ZevoEventBus();

const EVENTS = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED'
};

module.exports = {
  eventBus,
  EVENTS
};
