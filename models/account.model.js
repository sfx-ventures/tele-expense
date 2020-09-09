module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define('account', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user: {
            type: Sequelize.INTEGER
        },
        verb: {
            type: Sequelize.STRING
        },
        amount: {
            type: Sequelize.DECIMAL
        },
        date: {
            type: Sequelize.INTEGER
        },
        message_id: {
            type: Sequelize.INTEGER
        },
        month: {
            type: Sequelize.STRING
        },
        year: {
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: true
    })

    return Account
}