import { useApi } from '@Server/api/index.js';
import { useMessenger } from '@Server/systems/messenger.js';
import { RebarItems } from '@Shared/types/items.js';
import * as alt from 'alt-server';
import { updateInventoryWebview } from './inventoryHandler.js';

const Messenger = useMessenger();

Messenger.commands.register({
    name: 'additem',
    desc: 'Adds item with quantity',
    callback: async (player: alt.Player, name: string, quantity: string) => {
        const ItemAPI = await useApi().getAsync('item-manager-api');
        if (isNaN(parseInt(quantity))) return;
        ItemAPI.usePlayerItemManager(player).add(name, parseInt(quantity));

        updateInventoryWebview(player);
    },
});
