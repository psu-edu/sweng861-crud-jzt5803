const { sequelize } = require('../db');
const User = require('./User');
const Metric = require('./Metric');
const WeatherData = require('./WeatherData');
const DomainEvent = require('./DomainEvent');

// Define associations
User.hasMany(Metric, { foreignKey: 'userId', onDelete: 'CASCADE' });
Metric.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WeatherData, { foreignKey: 'userId', onDelete: 'CASCADE' });
WeatherData.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DomainEvent, { foreignKey: 'userId', onDelete: 'CASCADE' });
DomainEvent.belongsTo(User, { foreignKey: 'userId' });

// Lazy initialization
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await sequelize.sync();
    dbInitialized = true;
    console.log('Database synced');
  }
}

module.exports = {
  sequelize,
  User,
  Metric,
  WeatherData,
  DomainEvent,
  ensureDb,
};
