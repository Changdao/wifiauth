var Sequelize = require('sequelize');

var sequelize = new Sequelize('wifiauth', 'wifiauth', 'wifiauth', {
    host:"localhost",
    logging: true,
    define: {
        freezeTableName: true,
        underscored: true

    },
    dialect:'postgres'
});

exports.sequelize = sequelize;
exports.Sequelize = Sequelize;
