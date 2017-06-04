var Sequelize = require('sequelize');

var sequelize = new Sequelize('ninecoupon', 'ninecoupon', 'ninecoupon', {
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
