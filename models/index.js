const Sequelize = require('sequelize')
// const sequelize = new Sequelize('sqlite::memory:')
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/db.sqlite',
    logging: false
  })

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.account = require('./account.model.js')(sequelize,Sequelize)

module.exports = db;