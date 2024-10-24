import * as alt from 'alt-server';
import { useApi } from '@Server/api/index.js';
import { useMessenger } from '@Server/systems/messenger.js';
import { updateInventoryWebview } from './inventoryHandler.js';
import { useRebar } from '@Server/index.js';

const Messenger = useMessenger();
const Rebar = useRebar();

Messenger.commands.register({
    name: 'debuginv',
    desc: 'Debug inventory contents',
    callback: async (player: alt.Player) => {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const items = rebarDocument.items || [];

        // Log full inventory contents
        console.log('=== Inventory Debug ===');
        console.log(`Total items: ${items.length}`);
        items.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} (${item.uid}) - Qty: ${item.quantity}`);
        });

        // Also log the raw document for inspection
        console.log('Raw document:', JSON.stringify(rebarDocument, null, 2));

        // Send feedback to player
        Messenger.message.send(player, {
            content: `Inventory contains ${items.length} items. Check server console for details.`,
            type: 'info',
        });
    },
});

// Also let's enhance the additem command with better feedback
Messenger.commands.register({
    name: 'additem',
    desc: 'Adds item with quantity',
    callback: async (player: alt.Player, name: string, quantity: string) => {
        const ItemAPI = await useApi().getAsync('item-manager-api');
        if (isNaN(parseInt(quantity))) {
            Messenger.message.send(player, { content: 'Invalid quantity specified.', type: 'info' });
            return;
        }

        try {
            const result = await ItemAPI.usePlayerItemManager(player).add(name, parseInt(quantity));
            const rebarDocument = Rebar.document.character.useCharacter(player).get();

            console.log(`Added item ${name} x${quantity}. Current inventory size: ${rebarDocument.items?.length || 0}`);
            Messenger.message.send(player, { content: `Added ${name} x${quantity} to inventory.`, type: 'info' });

            updateInventoryWebview(player);
        } catch (error) {
            console.error('Error adding item:', error);
            Messenger.message.send(player, {
                content: 'Failed to add item. Check server console for details.',
                type: 'info',
            });
        }
    },
});

Messenger.commands.register({
    name: 'clearinventory',
    desc: 'Clears inventory',
    callback: async (player: alt.Player) => {
        Rebar.document.character.useCharacter(player).set('items', []);

        updateInventoryWebview(player);
    },
});
