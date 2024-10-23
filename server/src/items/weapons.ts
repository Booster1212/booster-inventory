import * as alt from 'alt-server';

import { useApi } from '@Server/api/index.js';
import { Item } from '@Shared/types/items.js';

declare module '@Shared/types/items.js' {
    interface RebarItems {
        weapon_pistol: string;
        weapon_railgun: string;
        weapon_rpg: string;
        weapon_carbinerifle_mk2: string;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'inventory:useWeapon': (player: alt.Player, item: Item) => void;
    }
}

export const weapons: Array<Item> = [
    {
        name: 'P226 Sidearm',
        desc: 'Standard-issue sidearm featuring a polymer frame and steel slide. Known for its reliability and consistent performance in the field. Chambered in 9mm with a 15-round magazine capacity.',
        id: 'weapon_pistol',
        icon: '../../../images/Pistol.png',
        maxStack: 1,
        quantity: 1,
        uid: 'inventory_weapon_pistol_mk2',
        weight: 5,
        useEventName: 'inventory:useWeapon',
        data: {
            condition: 100,
            ammo: '15/15',
            accuracy: 75,
            recoil: 'Low',
        },
    },
    {
        name: 'Coil Railgun',
        desc: 'Advanced electromagnetic weapon system capable of accelerating projectiles to hypervelocity. Features integrated targeting assistance and reinforced barrel assembly. Requires specialized power cells.',
        id: 'weapon_railgun',
        icon: '../../../images/Railgun.png',
        maxStack: 1,
        quantity: 1,
        uid: 'inventory_weapon_railgun',
        weight: 12,
        useEventName: 'inventory:useWeapon',
        data: {
            condition: 100,
            ammo: '1/1',
            accuracy: 95,
            recoil: 'High',
            chargeTime: '2.0s',
        },
    },
    {
        name: 'Carbine Rifle',
        desc: 'Military-grade assault rifle featuring modular design and advanced optics. Delivers consistent accuracy and controllable fire rate. Standard NATO 5.56mm ammunition with 30-round magazine.',
        id: 'weapon_carbinerifle_mk2',
        icon: '../../../images/AssaultRifle.png',
        maxStack: 1,
        quantity: 1,
        uid: 'inventory_weapon_carbinerifle_mk2',
        weight: 8,
        useEventName: 'inventory:useWeapon',
        data: {
            condition: 100,
            ammo: '30/30',
            accuracy: 85,
            recoil: 'Medium',
            fireRate: 'Auto',
        },
    },
    {
        name: 'RPG-7',
        desc: 'Shoulder-fired anti-tank weapon system. Features reinforced launch tube and advanced safety mechanisms. Delivers high-explosive warheads with significant area effect. Handle with extreme caution.',
        id: 'weapon_rpg',
        icon: '../../../images/RPG.png',
        maxStack: 1,
        quantity: 1,
        uid: 'inventory_weapon_rpg',
        weight: 15,
        useEventName: 'inventory:useWeapon',
        data: {
            condition: 100,
            ammo: '1/1',
            accuracy: 70,
            recoil: 'Extreme',
            blastRadius: 'Large',
        },
    },
];

const ItemManager = await useApi().getAsync('item-manager-api');
for (const item of weapons) {
    ItemManager.useItemManager().create(item);
}
