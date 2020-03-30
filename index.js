const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

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

const Villagers = sequelize.import('models/Users');

function isInteger(x) {
    return x % 1 === 0;
}

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
				return message.channel.send("Hi! Welcome to the Stalk Market Tracker Test\n\n" +
		    "Please use the following commands:" +
				"\n`!add villager-name island-name` - Add your villager's name and your island." +
		    "\n`!sell` - Displays all submitted prices to purchase turnips from Daisy Mae (every Sunday)." +
				"\n`!sell price` - Post your sell price set by Daisy Mae." +
		    "\n`!buy` - Displays all submitted prices to sell turnips to Timmy and Tommy at Nook's Cranny." +
		    "\n`!buy price` - Post your buy price set by Timmy and Tommy.");
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
		} else if (command === 'villagerinfo') {
      const villagerName = commandArgs;

      // equivalent to: SELECT * FROM tags WHERE name = 'tagName' LIMIT 1;
      const villager = await Villagers.findOne({ where: { name: villagerName } });
      if (villager) {
      	return message.channel.send(`${villagerName} was created by ${villager.username} at ${villager.createdAt} and has been used ${villager.usage_count} times.`);
      }
      return message.reply(`Could not find villager: ${villagerName}`);
		} else if (command === 'buy') {
			const splitArgs = commandArgs.split(' ');
			const buyTurnips = splitArgs.join(' ');
			const villager = await Villagers.findOne({ where: { username: message.author.username } });
			const villagerName = villager.name;
      const villagerList = await Villagers.findAll();

			if (!buyTurnips) {
				const villagerString = villagerList.map(t => `${t.name}  - ${t.island} island: ${t.buy_turnips} Bells.`).join('\n') || '... It looks like there are no sale prices set.';
				return message.channel.send(`Timmy and Tommy are selling turnips at these prices:\n${villagerString}`);
			}
			else if (villagerName && isInteger(buyTurnips) && (buyTurnips >= 1 && buyTurnips <= 999)) {
				const affectedRows = await Villagers.update({ buy_turnips: buyTurnips }, { where: { name: villagerName } });
				if (affectedRows > 0) {
					return message.reply(`Villager ${villagerName} added to the Stalk Market Tracker - Timmy and Tommy are buying turnips at ${villager.island} for ${buyTurnips} bells.`);
				}
			}
			else if (isNaN(buyTurnips) || isInteger(!buyTurnips) || buyTurnips < 1 || sellTurnips > 999) {
				return message.reply(`Please enter a valid bell price.\nBell prices accepted: positive, whole numbers from 1 - 999.`);
			}
			return message.reply(`Could not find a villager with name ${villagerName}.`);

		} else if (command === 'sell') {
	      // equivalent to: SELECT name FROM tags;
				const splitArgs = commandArgs.split(' ');
				const sellTurnips = splitArgs.join('');
				const villager = await Villagers.findOne({ where: { username: message.author.username } });
				const villagerName = villager.name;
	      const villagerList = await Villagers.findAll();

				if (!sellTurnips) {
					const villagerString = villagerList.map(t => `${t.name}  - ${t.island} island: ${t.sell_turnips} Bells.`).join('\n') || '... It looks like there are no sale prices set.';
		      return message.channel.send(`Daisy Mae is selling turnips at these prices:\n${villagerString}`);
				}
				else if (villagerName && isInteger(sellTurnips) && (sellTurnips >= 1 && sellTurnips <= 999)) {
					const affectedRows = await Villagers.update({ sell_turnips: sellTurnips }, { where: { name: villagerName } });
					if (affectedRows > 0) {
						return message.reply(`Villager ${villagerName} added to the Stalk Market Tracker - Daisy Mae is selling turnips at ${villager.island} for ${sellTurnips} bells.`);
					}
				}
				else if (isNaN(sellTurnips) || isInteger(!sellTurnips) || sellTurnips < 1 || sellTurnips > 999) {
					return message.reply(`Please enter a valid bell price.\nBell prices accepted: positive, whole numbers from 1 - 999.`);
				}
				return message.reply(`Could not find a villager with name ${villagerName}.`);

		} else if (command === 'remove') {
      const villagerName = commandArgs;
      const rowCount = await Villagers.destroy({ where: { name: villagerName } });
      if (!rowCount) return message.reply('That villager does not exist.');
      return message.reply(`Villager ${villagerName} has been deleted.`);
		}
	}
});

client.login(process.env.TOKEN);
