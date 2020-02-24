/* eslint-disable require-jsdoc */
const config = require('./config.json');
const path = require('path');

module.exports = function PetFeeder(mod) {
    mod.game.initialize('inventory');

    const PET_FOODS = [167133, 167134, 177131, 206046];
    const PARTNER_FOODS = [206049];
    let playerLocation;
    let petType; // 0: pet, 1: partner
    let onCd = false;

    mod.dispatch.addDefinition('S_UPDATE_SERVANT_INFO', 0, path.join(__dirname, 'S_UPDATE_SERVANT_INFO.def'));

    mod.game.inventory.on('update', () => {
        if (!mod.settings.enabled) return;
        petFood = [];
        partnerFood = [];

        mod.game.inventory.findAll(PET_FOODS).forEach((item) => {
            petFood.push({
                id: item.id,
                dbid: item.dbid,
                amount: item.amount,
                pocket: item.pocket,
                slot: item.slot,
            });
        });
        mod.game.inventory.findAll(PARTNER_FOODS).forEach((item) => {
            partnerFood.push({
                id: item.id,
                dbid: item.dbid,
                amount: item.amount,
                pocket: item.pocket,
                slot: item.slot,
            });
        });
    });

    mod.hook('C_PLAYER_LOCATION', 5, (event) => {
        playerLocation = event.loc;
    });

    mod.hook('S_REQUEST_SPAWN_SERVANT', 4, (event) => {
        if (mod.game.me.gameId == event.ownerId) {
            petType = event.type;
            if (mod.settings.enabled && event.energy < mod.settings.minimumEnergy) {
                feedPet();
            }
        }
    });

    mod.hook('S_UPDATE_SERVANT_INFO', 0, (event) => {
        if (mod.settings.enabled && event.energy < mod.settings.minimumEnergy) {
            feedPet();
        }
    });

    function feedPet() {
        // Pet
        if (petType == 0) {
            const food = petFood.reduce((max, item) => (item.id > max.id ? item : max), petFood[0]);
            useItem(food);
        }
        // Partner
        if (petType == 1) {
            const food = partnerFood.reduce((max, item) => (item.id > max.id ? item : max), partnerFood[0]);
            useItem(food);
        }

    }

    function useItem(item) {
        if (onCd) return;
        if (item == undefined) {
            mod.command.message('No pet food in inventory to feed pet type ' + petType);
            return;
        }

        onCd = true;
        mod.toServer('C_USE_ITEM', 3, {
            gameId: mod.game.me.gameId,
            id: item.id,
            dbid: item.dbid,
            amount: 1,
            loc: playerLocation.loc,
            w: playerLocation.w,
        });
        // Send Notification
        if (mod.settings.sendNotifications) {
            mod.command.message('Used ' + feedList[i].name + ', ' + feedList[i].invQtd + ' remaining.');
        }

        mod.setTimeout(() => {
            onCd = false;
        }, 2500);
    }

    mod.command.add(['autopetfeeder', 'petfeeder'], (arg) => {
        if (arg) arg = arg.toLowerCase();

        if (arg == undefined) {
            config.enabled = !config.enabled;
        } else if (['enable', 'on'].includes(arg)) {
            config.enabled = true;
        } else if (['disable', 'off'].includes(arg)) {
            config.enabled = false;
        }

        mod.command.message(`${config.enabled ? 'Enabled' : 'Disabled'}`);
    });

    mod.command.add('feedpet', () => {
        feedPet();
    });

    this.saveState = () => {
        const state = {
        };
        return state;
    };

    this.loadState = (state) => {
    };

    this.destructor = () => {
    };
};
