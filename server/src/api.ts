import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useApi } from '@Server/api/index.js';
import { Item } from '@Shared/types/items.js';
import { InventoryConfig } from '../../shared/config.js';
import { InventoryEvents } from '../../shared/events.js';
import { useWebview } from '@Server/player/webview.js';

const Rebar = useRebar();

export function useInventoryAPI() {
    function getTotalWeight(items: Item[]): number {
        return items.reduce((acc, item) => acc + item.weight * item.quantity, 0);
    }

    function canAddItem(player: alt.Player, item: Item): boolean {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const currentItems = rebarDocument.items || [];
        const newWeight = getTotalWeight(currentItems) + item.weight * item.quantity;

        return newWeight <= InventoryConfig.itemManager.weight.maxWeight;
    }

    function hasItem(player: alt.Player, itemId: string): boolean {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        return rebarDocument.items?.some((item) => item.id === itemId) || false;
    }

    function getItemCount(player: alt.Player, itemId: string): number {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const items = rebarDocument.items || [];
        return items.reduce((count, item) => {
            if (item.id === itemId) {
                return count + item.quantity;
            }
            return count;
        }, 0);
    }

    async function addItem(player: alt.Player, item: Item): Promise<boolean> {
        try {
            if (!canAddItem(player, item)) {
                return false;
            }

            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentItems = [...(rebarDocument.get().items || [])];

            const existingItem = currentItems.find((i) => i.id === item.id && i.quantity < i.maxStack);
            if (existingItem) {
                const spaceInStack = existingItem.maxStack - existingItem.quantity;
                const amountToAdd = Math.min(item.quantity, spaceInStack);

                existingItem.quantity += amountToAdd;

                if (amountToAdd < item.quantity) {
                    const newItem = {
                        ...item,
                        quantity: item.quantity - amountToAdd,
                        uid: `${item.id}_${Date.now()}`,
                    };
                    currentItems.push(newItem);
                }
            } else {
                const newItem = {
                    ...item,
                    uid: `${item.id}_${Date.now()}`,
                };
                currentItems.push(newItem);
            }

            rebarDocument.set('items', currentItems);
            updateInventoryWebview(player);
            return true;
        } catch (error) {
            console.error('Error adding item:', error);
            return false;
        }
    }

    async function removeItem(player: alt.Player, itemId: string, quantity: number = 1): Promise<boolean> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            let currentItems = [...(rebarDocument.get().items || [])];
            let remainingToRemove = quantity;

            currentItems = currentItems.reduce((acc: Item[], item) => {
                if (item.id !== itemId || remainingToRemove <= 0) {
                    acc.push(item);
                    return acc;
                }

                if (item.quantity > remainingToRemove) {
                    acc.push({
                        ...item,
                        quantity: item.quantity - remainingToRemove,
                    });
                    remainingToRemove = 0;
                } else {
                    remainingToRemove -= item.quantity;
                }

                return acc;
            }, []);

            if (remainingToRemove > 0) {
                return false;
            }

            rebarDocument.set('items', currentItems);
            updateInventoryWebview(player);
            return true;
        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }

    function updateInventoryWebview(player: alt.Player) {
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

    return {
        addItem,
        removeItem,
        hasItem,
        getItemCount,
        canAddItem,
        getTotalWeight,
        updateInventoryWebview,
    };
}

// Register the API
declare global {
    export interface ServerPlugin {
        ['inventory-api']: ReturnType<typeof useInventoryAPI>;
    }
}

useApi().register('inventory-api', useInventoryAPI());
