import * as alt from 'alt-server';
import { useApi } from '@Server/api/index.js';
import { useMessenger } from '@Server/systems/messenger.js';
import { useRebar } from '@Server/index.js';
import { RebarItems } from '@Shared/types/items.js';
import { updateInventoryWebview } from './inventoryHandler.js';
import { equipmentService } from './services/EquipmentService.js';
import { toolbarService } from './services/ToolbarService.js';

const Messenger = useMessenger();
const Rebar = useRebar();

Messenger.commands.register({
    name: 'debuginv',
    desc: 'Debug inventory contents',
    callback: async (player: alt.Player) => {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const items = rebarDocument.items || [];
        const toolbar = rebarDocument.toolbar || [];
        const equipment = rebarDocument.equipment || [];

        console.log('=== Inventory Debug ===');
        console.log(`Total items: ${items.length}`);
        items.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} (${item.uid}) - Qty: ${item.quantity}`);
        });

        console.log('\n=== Toolbar Items ===');
        toolbar.forEach((item, index) => {
            if (item) {
                console.log(`Slot ${index + 1}: ${item.name} (${item.uid})`);
            }
        });

        console.log('\n=== Equipment Items ===');
        equipment.forEach((slot) => {
            if (slot.item) {
                console.log(`${slot.name}: ${slot.item.name} (${slot.item.uid})`);
            }
        });

        Messenger.message.send(player, {
            content: `Debug: ${items.length} items, ${toolbar.filter((i) => i).length} toolbar items, ${equipment.filter((s) => s.item).length} equipped items`,
            type: 'info',
        });
    },
});

Messenger.commands.register({
    name: 'additem',
    desc: 'Adds item with quantity',
    callback: async (player: alt.Player, name: keyof RebarItems, quantity: string) => {
        const ItemAPI = await useApi().getAsync('item-manager-api');
        const qty = parseInt(quantity);

        if (isNaN(qty) || qty <= 0) {
            Messenger.message.send(player, { content: 'Invalid quantity specified.', type: 'warning' });
            return;
        }

        try {
            const result = await ItemAPI.usePlayerItemManager(player).add(name, qty);
            if (!result) {
                Messenger.message.send(player, {
                    content: 'Failed to add item - inventory might be full.',
                    type: 'warning',
                });
                return;
            }

            console.log(`Added item ${name} x${qty} to ${player.name}'s inventory`);
            Messenger.message.send(player, { content: `Added ${name} x${qty} to inventory.`, type: 'info' });
            updateInventoryWebview(player);
        } catch (error) {
            console.error('Error adding item:', error);
            Messenger.message.send(player, { content: 'Failed to add item. Check server console.', type: 'warning' });
        }
    },
});

Messenger.commands.register({
    name: 'clearinventory',
    desc: 'Clears inventory, toolbar and equipment',
    callback: async (player: alt.Player) => {
        const rebarDocument = Rebar.document.character.useCharacter(player);

        await Promise.all([
            rebarDocument.set('items', []),
            toolbarService.initializePlayerToolbar(player),
            equipmentService.initializePlayerEquipment(player),
        ]);

        Messenger.message.send(player, { content: 'Inventory, toolbar and equipment cleared.', type: 'info' });
        updateInventoryWebview(player);
    },
});

Messenger.commands.register({
    name: 'clearequipment',
    desc: 'Clears only equipment slots',
    callback: async (player: alt.Player) => {
        await equipmentService.initializePlayerEquipment(player);
        Messenger.message.send(player, { content: 'Equipment slots cleared.', type: 'info' });
        updateInventoryWebview(player);
    },
});

Messenger.commands.register({
    name: 'cleartoolbar',
    desc: 'Clears toolbar slots',
    callback: async (player: alt.Player) => {
        await toolbarService.initializePlayerToolbar(player);
        Messenger.message.send(player, { content: 'Toolbar slots cleared.', type: 'info' });
        updateInventoryWebview(player);
    },
});
