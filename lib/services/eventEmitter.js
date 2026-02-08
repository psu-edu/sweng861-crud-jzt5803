const EventEmitter = require('events');

const globalForEmitter = globalThis;

class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('metric.created', this.handleMetricCreated.bind(this));
    this.on('metric.updated', this.handleMetricUpdated.bind(this));
    this.on('metric.deleted', this.handleMetricDeleted.bind(this));
    this.on('weather.fetched', this.handleWeatherFetched.bind(this));
    this.on('*', this.logEvent.bind(this));
  }

  async emitDomainEvent(eventType, entityType, entityId, payload, userId) {
    try {
      const { DomainEvent } = require('../models');
      const event = await DomainEvent.create({
        eventType,
        entityType,
        entityId: String(entityId),
        payload,
        userId,
        status: 'pending',
      });

      console.log(
        `[Event] Emitted: ${eventType} for ${entityType}:${entityId}`
      );

      this.emit(eventType, { event, payload, userId });
      this.emit('*', { eventType, entityType, entityId, payload, userId });

      return event;
    } catch (error) {
      console.error(`[Event] Failed to emit ${eventType}:`, error.message);
      throw error;
    }
  }

  async handleMetricCreated({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing metric.created: ${payload.name} (${payload.category})`
      );
      await this.simulateAsyncProcessing();
      await event.update({ status: 'processed', processedAt: new Date() });
      console.log(`[EventHandler] Completed processing metric.created`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  async handleMetricUpdated({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing metric.updated: ${payload.id} - ${payload.changes}`
      );
      await this.simulateAsyncProcessing();
      await event.update({ status: 'processed', processedAt: new Date() });
      console.log(`[EventHandler] Completed processing metric.updated`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  async handleMetricDeleted({ event, payload }) {
    try {
      console.log(`[EventHandler] Processing metric.deleted: ${payload.id}`);
      await this.simulateAsyncProcessing();
      await event.update({ status: 'processed', processedAt: new Date() });
      console.log(`[EventHandler] Completed processing metric.deleted`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  async handleWeatherFetched({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing weather.fetched: ${payload.latitude},${payload.longitude}`
      );
      await this.simulateAsyncProcessing();
      await event.update({ status: 'processed', processedAt: new Date() });
      console.log(`[EventHandler] Completed processing weather.fetched`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  logEvent({ eventType, entityType, entityId }) {
    const timestamp = new Date().toISOString();
    console.log(
      `[EventLog] ${timestamp} | ${eventType} | ${entityType}:${entityId}`
    );
  }

  async markEventFailed(event, error) {
    console.error(`[EventHandler] Event processing failed:`, error.message);
    await event.update({ status: 'failed', error: error.message });
  }

  simulateAsyncProcessing() {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}

const domainEventEmitter =
  globalForEmitter._domainEventEmitter || new DomainEventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter._domainEventEmitter = domainEventEmitter;
}

module.exports = domainEventEmitter;
