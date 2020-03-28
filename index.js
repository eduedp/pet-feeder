/* eslint-disable require-jsdoc */
const path = require('path');

module.exports = function PetFeeder(mod) {
    mod.game.initialize('inventory');

    const PET_FOODS = [167133, 167134, 177131, 206046];
    const PARTNER_FOODS = [206049];
    let playerLocation;
    let petType; // 0: pet, 1: partner
    let onCd = false;
    let petFood = [];
    let partnerFood = [];

    mod.dispatch.addDefinition('S_UPDATE_SERVANT_INFO', 0, path.join(__dirname, 'S_UPDATE_SERVANT_INFO.0.def'));

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
        if (mod.game.me.gameId != event.ownerId) return;
        if (checkEnergy(event)) {
            feedPet();
        }
    });

    mod.hook('S_UPDATE_SERVANT_INFO', 0, (event) => {
        if (checkEnergy(event)) {
            feedPet();
        }
    });

    function checkEnergy(event) {
        petType = event.type;
        if (!mod.settings.enabled) return false;
        if (petType == 0) { // Pet
            return event.energy < mod.settings.minimumEnergy;
        }
        if (petType == 1) { // Partner
            return event.energy/3 < mod.settings.minimumEnergy;
        }
    }

    function feedPet() {
        if (petType == 0) { // Pet
            const food = petFood.reduce((max, item) => (item.id > max.id ? item : max), petFood[0]);
            useItem(food);
        }
        if (petType == 1) { // Partner
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
            unk4: true,
        });

        mod.setTimeout(() => {
            onCd = false;
        }, 2500);
    }

    mod.command.add(['autopetfeeder', 'petfeeder'], (arg) => {
        if (arg) arg = arg.toLowerCase();

        if (arg == undefined) {
            mod.settings.enabled = !mod.settings.enabled;
        } else if (['enable', 'on'].includes(arg)) {
            mod.settings.enabled = true;
        } else if (['disable', 'off'].includes(arg)) {
            mod.settings.enabled = false;
        }

        mod.command.message(`${mod.settings.enabled ? 'Enabled' : 'Disabled'}`);
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
