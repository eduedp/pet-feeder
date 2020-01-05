/* eslint-disable require-jsdoc */
const config = require('./config.json');

module.exports = function PetFeeder(mod) {
    let	playerLocation;
    let onCd = false;
    let petType; // 0: pet, 1: partner


    const feedList = [
        {
            name: 'Pet Treat', // Common item. Restores 30 energy
            id: 167133,
            invQtd: 0,
            dbid: 0,
            type: 0,
        },
        {
            name: 'Pet Treat', // Common item. Restores 30 energy
            id: 177131,
            invQtd: 0,
            dbid: 0,
            type: 0,
        },
        {
            name: 'Pet Food', // Uncommon item. Restores 100 energy
            id: 167134,
            invQtd: 0,
            dbid: 0,
            type: 0,
        },
        {
            name: 'Common Pet Food', // Uncommon item. Restores 30 energy
            id: 206046,
            invQtd: 0,
            dbid: 0,
            type: 0,
        },
        {
            name: 'Puppy Figurine', // Partner Food
            id: 206049,
            invQtd: 0,
            dbid: 0,
            type: 1,
        },
    ];

    mod.hook('C_PLAYER_LOCATION', 5, (event) => { playerLocation = event.loc; });

    mod.hook('S_ITEMLIST', 3, { order: -10 }, (event) => {
        if (!mod.settings.enabled) return;

        const tempInv = event.items;
        for (let i = 0; i < tempInv.length; i++) {
            for (let o = 0; o < feedList.length; o++) {
                if (feedList[o].id == tempInv[i].id) {
                    feedList[o].invQtd = tempInv[i].amount;
                    feedList[o].dbid = tempInv[i].dbid;
                }
            }
        }
    });

    mod.hook('S_REQUEST_SPAWN_SERVANT', 3, (event) => {
        if (mod.game.me.gameId == event.ownerId) {
            petType = event.type;
            if (mod.settings.enabled && event.energy < mod.settings.minimumEnergy) {
                feedPet();
            }
        }
    });

    mod.hook('S_CHANGE_SERVANT_ENERGY', 2, (event) => {
        if (mod.settings.enabled && event.energy < mod.settings.minimumEnergy) {
            feedPet();
        }
    });

    function feedPet() {
        for (let i = 0; i < feedList.length; i++) {
            if (feedList[i].invQtd > 0 && feedList[i].type == petType) {
                useItem(feedList[i]);
                feedList[i].invQtd--;
                onCd = true;
                setTimeout(()=>{ onCd = false; }, 3000);
                if (mod.settings.sendNotifications) mod.command.message('Used ' + feedList[i].name + ', ' + feedList[i].invQtd + ' remaining.');
                return;
            }
        }

        // warning. no food in inventory
        mod.command.message('No pet food in inventory to feed pet type ' + petType);
    }

    function useItem(foodInfo) {
        mod.toServer('C_USE_ITEM', 3, {
            gameId: mod.game.me.gameId,
            id: foodInfo.id,
            dbid: foodInfo.dbid,
            target: 0,
            amount: 1,
            dest: {x: 0, y: 0, z: 0},
            loc: playerLocation.loc,
            w: playerLocation.w,
            unk1: 0,
            unk2: 0,
            unk3: 0,
            unk4: 1,
        });
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
}
