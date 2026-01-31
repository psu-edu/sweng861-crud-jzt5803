const EventEmitter = require('events');
const { DomainEvent } = require('../database');

/**
 * Domain Event Emitter Service
 * Handles domain events asynchronously and persists them to the database
 */
class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for different event types
   */
  setupEventHandlers() {
    // Handle metric events
    this.on('metric.created', this.handleMetricCreated.bind(this));
    this.on('metric.updated', this.handleMetricUpdated.bind(this));
    this.on('metric.deleted', this.handleMetricDeleted.bind(this));

    // Handle weather data events
    this.on('weather.fetched', this.handleWeatherFetched.bind(this));

    // Generic event handler for logging
    this.on('*', this.logEvent.bind(this));
  }

  /**
   * Emit a domain event and persist it
   * @param {string} eventType - Type of event (e.g., 'metric.created')
   * @param {string} entityType - Type of entity (e.g., 'Metric')
   * @param {string} entityId - ID of the entity
   * @param {object} payload - Event payload data
   * @param {number} userId - ID of the user who triggered the event
   */
  async emitDomainEvent(eventType, entityType, entityId, payload, userId) {
    try {
      // Persist event to database
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

      // Emit the event for async processing
      this.emit(eventType, { event, payload, userId });

      // Also emit to wildcard handler for logging
      this.emit('*', { eventType, entityType, entityId, payload, userId });

      return event;
    } catch (error) {
      console.error(`[Event] Failed to emit ${eventType}:`, error.message);
      throw error;
    }
  }

  /**
   * Handle metric created event
   */
  async handleMetricCreated({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing metric.created: ${payload.name} (${payload.category})`
      );

      // Simulate async processing (e.g., sending notification, updating analytics)
      await this.simulateAsyncProcessing();

      // Mark event as processed
      await event.update({
        status: 'processed',
        processedAt: new Date(),
      });

      console.log(`[EventHandler] Completed processing metric.created`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  /**
   * Handle metric updated event
   */
  async handleMetricUpdated({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing metric.updated: ${payload.id} - ${payload.changes}`
      );

      await this.simulateAsyncProcessing();

      await event.update({
        status: 'processed',
        processedAt: new Date(),
      });

      console.log(`[EventHandler] Completed processing metric.updated`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  /**
   * Handle metric deleted event
   */
  async handleMetricDeleted({ event, payload }) {
    try {
      console.log(`[EventHandler] Processing metric.deleted: ${payload.id}`);

      await this.simulateAsyncProcessing();

      await event.update({
        status: 'processed',
        processedAt: new Date(),
      });

      console.log(`[EventHandler] Completed processing metric.deleted`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  /**
   * Handle weather data fetched event
   */
  async handleWeatherFetched({ event, payload }) {
    try {
      console.log(
        `[EventHandler] Processing weather.fetched: ${payload.latitude},${payload.longitude}`
      );

      await this.simulateAsyncProcessing();

      await event.update({
        status: 'processed',
        processedAt: new Date(),
      });

      console.log(`[EventHandler] Completed processing weather.fetched`);
    } catch (error) {
      await this.markEventFailed(event, error);
    }
  }

  /**
   * Generic event logger
   */
  logEvent({ eventType, entityType, entityId }) {
    const timestamp = new Date().toISOString();
    console.log(
      `[EventLog] ${timestamp} | ${eventType} | ${entityType}:${entityId}`
    );
  }

  /**
   * Mark event as failed
   */
  async markEventFailed(event, error) {
    console.error(`[EventHandler] Event processing failed:`, error.message);
    await event.update({
      status: 'failed',
      error: error.message,
    });
  }

  /**
   * Simulate async processing delay
   */
  simulateAsyncProcessing() {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Export singleton instance
const domainEventEmitter = new DomainEventEmitter();
module.exports = domainEventEmitter;
