module.exports = (sequelize, Datatypes) => {
return sequelize.define('villager', {
	name: {
		type: Datatypes.STRING,
		unique: true,
	},
	island:  Datatypes.STRING,
	username: Datatypes.STRING,
	usage_count: {
		type: Datatypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	buy_turnips: {
		type: Datatypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
    isInt: true,
	},
	sell_turnips: {
		type: Datatypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
    isInt: true,
	},
});
};
