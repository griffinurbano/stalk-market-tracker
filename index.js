const Discord = require('discord.js');
const Sequelize = require('sequelize');

const client = new Discord.Client();
const PREFIX = '!';

const sequelize = new Sequelize('database', 'villager', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});


/*
 * equivalent to: CREATE TABLE tags(
 * name VARCHAR(255),
 * description TEXT,
 * villagername VARCHAR(255),
 * usage INT
 * );
 */
const Villagers = sequelize.define('villager', {
	name: {
		type: Sequelize.STRING,
		unique: true,
	},
	island:  Sequelize.STRING,
	username: Sequelize.STRING,
	usage_count: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	buy_turnips: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	sell_turnips: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

client.once('ready', () => {
  Villagers.sync();
});

client.on('message', async message => {
	if (message.content.startsWith(PREFIX)) { //if starts with !
		const input = message.content.slice(PREFIX.length).split(/ +/);
		const command = input.shift();
		const commandArgs = input.join(' ');

		if (command === 'add') {
			const splitArgs = commandArgs.split(/ +/);
      const villagerName = splitArgs.shift();
      const islandName = splitArgs.join(' ');

			if (villagerName == '' || islandName == '') {
				return message.reply('you did not provide a villager and/or island name. Proper usage would be \`!add <villager name> <island name>\`');
			}

      try {
      	// equivalent to: INSERT INTO tags (name, description, villagername) values (?, ?, ?);
      	const villager = await Villagers.create({
      		name: villagerName,
      		island: islandName,
      		username: message.author.username,
      	});

      	return message.reply(`Villager ${villager.name} from ${villager.island} added.`);
      }
      catch (e) {
      	if (e.name === 'SequelizeUniqueConstraintError') {
      		return message.reply('That villager already exists.');
      	}
      	return message.reply('Something went wrong with adding a villager.');
      }
		} else if (command === 'help') {
				return message.channel.send("Hi! Welcome to the Stalk Market Tracker.\n\n" +
		    "Please use the following commands:" +
				"\n`!add <villager name> <island name>` - Add your villager's name and your island." +
		    "\n`!sell` - Displays all submitted prices to purchase turnips from Daisy Mae (every Sunday)." +
		    "\n`!buy` - Displays all submitted prices to sell turnips to Timmy and Tommy at Nook's Cranny." +
		    "\n`!psell <villager name> <price>` - Post your sell price set by Daisy Mae." +
		    "\n`!pbuy <villager name> <price>` - Post your buy price set by Timmy and Tommy.");
			}
			else if (command === 'villager') {
      const villagerName = commandArgs;

      // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
      const villager = await Villagers.findOne({ where: { name: villagerName } });
      if (villager) {
      	// equivalent to: UPDATE tags SET usage_count = usage_count + 1 WHERE name = 'tagName';
      	villager.increment('usage_count');
      	return message.channel.send(villager.get('island'));
      }
			return message.reply(`Could not find villager: ${villagerName}`);
		} else if (command === 'pbuy') {
	      const splitArgs = commandArgs.split(' ');
	      const villagerName = splitArgs.shift();
				const buyTurnips = splitArgs.join(' ');
				const villager = await Villagers.findOne({ where: { name: villagerName } });

	      // equivalent to: UPDATE tags (descrption) values (?) WHERE name='?';
	      const affectedRows = await Villagers.update({ buy_turnips: buyTurnips }, { where: { name: villagerName } });
	      if (affectedRows > 0) {
	      	return message.reply(`Villager ${villagerName} added to the Stalk Market Tracker - Timmy and Tommy are buying turnips at ${villager.island} for ${buyTurnips} bells.`);
	      }
	      return message.reply(`Could not find a villager with name ${villagerName}.`);
		} else if (command === 'psell') {
	      const splitArgs = commandArgs.split(' ');
	      const villagerName = splitArgs.shift();
				const sellTurnips = splitArgs.join(' ');
				const villager = await Villagers.findOne({ where: { name: villagerName } });

	      // equivalent to: UPDATE tags (descrption) values (?) WHERE name='?';
	      const affectedRows = await Villagers.update({ sell_turnips: sellTurnips }, { where: { name: villagerName } });
	      if (affectedRows > 0) {
	      	return message.reply(`Villager ${villagerName} added to the Stalk Market Tracker - Daisy Mae is selling turnips at ${villager.island} for ${sellTurnips} bells.`);
	      }
	      return message.reply(`Could not find a villager with name ${villagerName}.`);
			}	else if (command === 'villagerinfo') {
      const villagerName = commandArgs;

      // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
      const villager = await Villagers.findOne({ where: { name: villagerName } });
      if (villager) {
      	return message.channel.send(`${villagerName} was created by ${villager.username} at ${villager.createdAt} and has been used ${villager.usage_count} times.`);
      }
      return message.reply(`Could not find villager: ${villagerName}`);
		} else if (command === 'buy') {
      // equivalent to: SELECT name FROM tags;
      const villagerList = await Villagers.findAll();
			const villagerString = villagerList.map(t => `${t.name} - ${t.island} island: ${t.buy_turnips} Bells.`).join('\n') || '... It looks like there are no buying prices set.';
      return message.channel.send(`Timmy and Tommy are buying turnips at these prices:\n${villagerString}`);
		} else if (command === 'sell') {
      // equivalent to: SELECT name FROM tags;
      const villagerList = await Villagers.findAll();
			const villagerString = villagerList.map(t => `${t.name}  - ${t.island} island: ${t.sell_turnips} Bells.`).join('\n') || '... It looks like there are no sale prices set.';
      return message.channel.send(`Daisy Mae is selling turnips at these prices:\n${villagerString}`);
		} else if (command === 'remove') {
      const villagerName = commandArgs;
// equivalent to: DELETE from tags WHERE name = ?;
      const rowCount = await Villagers.destroy({ where: { name: villagerName } });
      if (!rowCount) return message.reply('That villager does not exist.');

      return message.reply(`Villager ${villagerName} has been deleted.`);
		}
	}
});

client.login('NjkxODY0MTg3MDA5NDk5MTg2.XnmK1w.qbbyMLQ_GyikTheEfyphBJSdSxY');
