// Mock the models module to avoid requiring Sequelize/SQLite
jest.mock('@/lib/models', () => ({
  DomainEvent: {
    create: jest.fn(),
  },
}));

const { DomainEvent } = require('@/lib/models');

// Suppress console output during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.clearAllMocks();
  // Reset the singleton
  globalThis._domainEventEmitter = undefined;
  delete require.cache[require.resolve('@/lib/services/eventEmitter')];
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

function getEmitter() {
  return require('@/lib/services/eventEmitter');
}

describe('DomainEventEmitter', () => {
  describe('emitDomainEvent', () => {
    it('saves event to database and emits it', async () => {
      const mockEvent = {
        id: 'evt-1',
        eventType: 'metric.created',
        status: 'pending',
        update: jest.fn(),
      };
      DomainEvent.create.mockResolvedValue(mockEvent);

      const emitter = getEmitter();
      const event = await emitter.emitDomainEvent(
        'metric.created',
        'Metric',
        'metric-123',
        { name: 'Test', category: 'enrollment' },
        'user-1'
      );

      expect(DomainEvent.create).toHaveBeenCalledWith({
        eventType: 'metric.created',
        entityType: 'Metric',
        entityId: 'metric-123',
        payload: { name: 'Test', category: 'enrollment' },
        userId: 'user-1',
        status: 'pending',
      });
      expect(event.id).toBe('evt-1');
    });

    it('converts entityId to string', async () => {
      DomainEvent.create.mockResolvedValue({
        id: 'evt-2',
        update: jest.fn(),
      });

      const emitter = getEmitter();
      await emitter.emitDomainEvent(
        'metric.deleted',
        'Metric',
        12345,
        {},
        'user-1'
      );

      expect(DomainEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: '12345' })
      );
    });

    it('throws when database save fails', async () => {
      DomainEvent.create.mockRejectedValue(new Error('DB connection lost'));

      const emitter = getEmitter();
      await expect(
        emitter.emitDomainEvent('metric.created', 'Metric', '1', {}, 'user-1')
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('event handlers', () => {
    it('handleMetricCreated processes and marks event as processed', async () => {
      const mockEvent = {
        id: 'evt-1',
        update: jest.fn().mockResolvedValue(undefined),
      };
      DomainEvent.create.mockResolvedValue(mockEvent);

      const emitter = getEmitter();
      await emitter.emitDomainEvent(
        'metric.created',
        'Metric',
        '1',
        { name: 'Test', category: 'enrollment' },
        'user-1'
      );

      // Wait for async handler to complete
      await new Promise((r) => setTimeout(r, 200));

      expect(mockEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processed' })
      );
    });

    it('handleMetricDeleted processes delete events', async () => {
      const mockEvent = {
        id: 'evt-2',
        update: jest.fn().mockResolvedValue(undefined),
      };
      DomainEvent.create.mockResolvedValue(mockEvent);

      const emitter = getEmitter();
      await emitter.emitDomainEvent(
        'metric.deleted',
        'Metric',
        '1',
        { id: '1' },
        'user-1'
      );

      await new Promise((r) => setTimeout(r, 200));

      expect(mockEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processed' })
      );
    });

    it('marks event as failed when handler throws', async () => {
      const mockEvent = {
        id: 'evt-3',
        update: jest.fn().mockImplementation(({ status }) => {
          if (status === 'processed') throw new Error('DB write failed');
          return Promise.resolve();
        }),
      };
      DomainEvent.create.mockResolvedValue(mockEvent);

      const emitter = getEmitter();
      await emitter.emitDomainEvent(
        'metric.created',
        'Metric',
        '1',
        { name: 'Test', category: 'enrollment' },
        'user-1'
      );

      await new Promise((r) => setTimeout(r, 200));

      // Should have attempted to mark as failed
      expect(mockEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
  });

  describe('logEvent', () => {
    it('logs wildcard events with timestamp', async () => {
      const mockEvent = {
        id: 'evt-4',
        update: jest.fn().mockResolvedValue(undefined),
      };
      DomainEvent.create.mockResolvedValue(mockEvent);

      const emitter = getEmitter();
      await emitter.emitDomainEvent(
        'weather.fetched',
        'WeatherData',
        'w-1',
        { latitude: 40 },
        'user-1'
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[EventLog]')
      );
    });
  });

  describe('singleton behavior', () => {
    it('returns the same instance on repeated require', () => {
      const emitter1 = getEmitter();
      const emitter2 = require('@/lib/services/eventEmitter');
      expect(emitter1).toBe(emitter2);
    });
  });
});
