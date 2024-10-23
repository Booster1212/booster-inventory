import * as alt from 'alt-server';

import { useApi } from '@Server/api/index.js';
import { Item } from '@Shared/types/items.js';

declare module '@Shared/types/items.js' {
    interface RebarItems {
        weapon_pistol: string;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'inventory:usePistol': (player: alt.Player, item: Item) => void;
    }
}

export const weapons: Array<Item> = [
    {
        name: 'pistol',
        desc: '.9mm pistol',
        id: 'weapon_pistol',
        icon: '../../../images/crate.jpg',
        maxStack: 1,
        quantity: 1,
        uid: 'inventory_weapon_pistol',
        weight: 5,
        useEventName: 'inventory:usePistol',
    },
];

const ItemManager = await useApi().getAsync('item-manager-api');
for (const item of weapons) {
    ItemManager.useItemManager().create(item);
}
