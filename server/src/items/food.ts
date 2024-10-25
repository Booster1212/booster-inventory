import * as alt from 'alt-server';

import { useApi } from '@Server/api/index.js';
import { Item } from '@Shared/types/items.js';

declare module '@Shared/types/items.js' {
    interface RebarItems {
        food_burger: string;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'inventory:useFood': (player: alt.Player, item: Item) => void;
    }
}

export const food: Array<Item> = [
    {
        name: 'Burger',
        desc: 'A classy burger.',
        id: 'food_burger',
        icon: '../../../images/Burger.png',
        maxStack: 12,
        quantity: 1,
        uid: 'inventory_food_burger',
        weight: 5,
        useEventName: 'inventory:useFood',
        data: {
            condition: 100,
            ammo: '15/15',
            accuracy: 75,
            recoil: 'Low',
        },
    },
];

const ItemManager = await useApi().getAsync('item-manager-api');
for (const item of food) {
    ItemManager.useItemManager().create(item);
}
