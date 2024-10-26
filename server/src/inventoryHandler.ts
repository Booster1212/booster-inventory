import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useWebview } from '@Server/player/webview.js';
import { Item } from '@Shared/types/items.js';
import { useApi } from '@Server/api/index.js';
import { InventoryEvents } from '../../shared/events.js';
import { InventoryConfig } from '../../shared/config.js';

const Rebar = useRebar();
const ItemManager = await useApi().getAsync('item-manager-api');

alt.onRpc(InventoryEvents.Server.Inventory_RequestItems, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.items;
});

alt.onClient(InventoryEvents.Server.Inventory_UseItem, (player: alt.Player, item: Item) => {
    ItemManager.usePlayerItemManager(player).use(item.uid);
});

alt.onClient(
    InventoryEvents.Server.Inventory_StackItems,
    async (player: alt.Player, uidToStackOn: string, uidToStack: string) => {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            let inventory = [...rebarDocument.get().items];

            const targetItemIndex = inventory.findIndex((item) => item.uid === uidToStackOn);
            const sourceItemIndex = inventory.findIndex((item) => item.uid === uidToStack);

            if (targetItemIndex === -1 || sourceItemIndex === -1) {
                return;
            }

            const targetItem = { ...inventory[targetItemIndex] };
            const sourceItem = { ...inventory[sourceItemIndex] };

            if (targetItem.id !== sourceItem.id) {
                return;
            }

            const availableSpace = targetItem.maxStack - targetItem.quantity;
            if (availableSpace <= 0) {
                return;
            }

            const amountToStack = Math.min(availableSpace, sourceItem.quantity);

            let newInventory = inventory.map((item) => ({ ...item }));

            newInventory[targetItemIndex] = {
                ...targetItem,
                quantity: targetItem.quantity + amountToStack,
            };

            if (sourceItem.quantity - amountToStack <= 0) {
                newInventory = newInventory.filter((_, index) => index !== sourceItemIndex);
            } else {
                newInventory[sourceItemIndex] = {
                    ...sourceItem,
                    quantity: sourceItem.quantity - amountToStack,
                };
            }

            const oldTotal = inventory.reduce((sum, item) => sum + item.quantity, 0);
            const newTotal = newInventory.reduce((sum, item) => sum + item.quantity, 0);

            if (oldTotal !== newTotal) {
                return;
            }

            rebarDocument.set('items', newInventory);

            const Webview = useWebview(player);
            const inventoryWithEmptySlots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
            newInventory.forEach((item, index) => {
                if (index < inventoryWithEmptySlots.length) {
                    inventoryWithEmptySlots[index] = item;
                }
            });

            Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);
        } catch (error) {
            console.error('Stack items error:', error);
        }
    },
);

alt.onClient(InventoryEvents.Server.Inventory_SplitItems, async (player: alt.Player, uid: string, quantity: number) => {
    try {
        const rebarDocument = Rebar.document.character.useCharacter(player);
        let inventory = [...rebarDocument.get().items];

        const sourceItemIndex = inventory.findIndex((item) => item.uid === uid);
        if (sourceItemIndex === -1) {
            return;
        }

        const sourceItem = inventory[sourceItemIndex];

        if (quantity <= 0 || quantity >= sourceItem.quantity) {
            return;
        }

        const newItem = {
            ...sourceItem,
            uid: `${sourceItem.uid}_split_${Date.now()}`,
            quantity: quantity,
        };

        let newInventory = inventory.map((item) => ({ ...item }));

        newInventory[sourceItemIndex] = {
            ...sourceItem,
            quantity: sourceItem.quantity - quantity,
        };

        newInventory.push(newItem);

        const oldTotal = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const newTotal = newInventory.reduce((sum, item) => sum + item.quantity, 0);
        const oldWeight = inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
        const newWeight = newInventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);

        if (oldTotal !== newTotal || oldWeight !== newWeight) {
            return;
        }

        rebarDocument.set('items', newInventory);

        const Webview = useWebview(player);
        const inventoryWithEmptySlots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
        newInventory.forEach((item, index) => {
            if (index < inventoryWithEmptySlots.length) {
                inventoryWithEmptySlots[index] = item;
            }
        });

        Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);
    } catch (error) {
        console.error('Split items error:', error);
    }
});

export function updateInventoryWebview(player: alt.Player) {
    try {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const Webview = useWebview(player);

        const inventoryWithEmptySlots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
        const items = rebarDocument.items.map((item) => ({ ...item }));

        items.forEach((item, index) => {
            if (index < inventoryWithEmptySlots.length) {
                inventoryWithEmptySlots[index] = item;
            }
        });

        Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);
    } catch (error) {
        console.error('Error updating inventory webview:', error);
    }
}
