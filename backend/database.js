const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

// User Model - Authentication and ownership
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
});

// Metric Model - Main domain entity for campus analytics
// Supports multi-tenancy via userId foreign key
const Metric = sequelize.define('Metric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  category: {
    type: DataTypes.ENUM(
      'enrollment',
      'facilities',
      'academic',
      'financial',
      'other'
    ),
    allowNull: false,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'count',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // userId is added via association below
});

// WeatherData Model - Store 3rd party API data
const WeatherData = sequelize.define('WeatherData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  windSpeed: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  weatherCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rawData: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  fetchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // userId is added via association below
});

// DomainEvent Model - Event logging for async processing
const DomainEvent = sequelize.define('DomainEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'failed'),
    defaultValue: 'pending',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Define Associations - Enforce ownership (multi-tenancy)
User.hasMany(Metric, { foreignKey: 'userId', onDelete: 'CASCADE' });
Metric.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WeatherData, { foreignKey: 'userId', onDelete: 'CASCADE' });
WeatherData.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DomainEvent, { foreignKey: 'userId', onDelete: 'CASCADE' });
DomainEvent.belongsTo(User, { foreignKey: 'userId' });

const initDb = async () => {
  await sequelize.sync({ alter: true });
  console.log('Database synced');
};

module.exports = {
  sequelize,
  User,
  Metric,
  WeatherData,
  DomainEvent,
  initDb,
};
