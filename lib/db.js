const { Sequelize } = require('sequelize');
const path = require('path');

const globalForSequelize = globalThis;

const sequelize =
  globalForSequelize._sequelize ||
  new Sequelize({
    dialect: 'sqlite',
    storage: path.join(process.cwd(), 'database.sqlite'),
    logging: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSequelize._sequelize = sequelize;
}

module.exports = { sequelize };
