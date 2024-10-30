import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useApi } from '@Server/api/index.js';
import { Item, RebarItems } from '@Shared/types/items.js';
import { InventoryConfig } from '../../shared/config.js';
import { InventoryEvents } from '../../shared/events.js';
import { useWebview } from '@Server/player/webview.js';

const Rebar = useRebar();

async function initializeInventoryAPI() {
    const ItemManager = await useApi().getAsync('item-manager-api');

    function getTotalWeight(items: Item[]): number {
        return items.reduce((acc, item) => acc + item.weight * item.quantity, 0);
    }

    function canAddItem(player: alt.Player, item: Item): boolean {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const currentItems = rebarDocument.items || [];
        const newWeight = getTotalWeight(currentItems) + item.weight * item.quantity;

        return newWeight <= InventoryConfig.itemManager.weight.maxWeight;
    }

    function hasItem(player: alt.Player, itemName: string): boolean {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        return rebarDocument.items?.some((item) => item.name === itemName) || false;
    }

    function getItemCount(player: alt.Player, itemName: string): number {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const items = rebarDocument.items || [];
        return items.reduce((count, item) => {
            if (item.name === itemName) {
                return count + item.quantity;
            }
            return count;
        }, 0);
    }

    async function addItem(player: alt.Player, itemName: keyof RebarItems, quantity: number = 1): Promise<boolean> {
        try {
            const itemDefinition = ItemManager.useItemManager().getBaseItem(itemName);
            if (!itemDefinition) {
                console.error(`Item ${itemName} not found in ItemManager`);
                return false;
            }

            const itemToAdd = {
                ...itemDefinition,
                quantity,
                uid: `${itemDefinition.id}_${Date.now()}`,
            };
            if (!canAddItem(player, itemToAdd)) {
                return false;
            }

            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentItems = [...(rebarDocument.get().items || [])];

            const existingItem = currentItems.find((i) => i.id === itemDefinition.id && i.quantity < i.maxStack);
            if (existingItem) {
                const spaceInStack = existingItem.maxStack - existingItem.quantity;
                const amountToAdd = Math.min(quantity, spaceInStack);

                existingItem.quantity += amountToAdd;

                if (amountToAdd < quantity) {
                    const newItem = {
                        ...itemDefinition,
                        quantity: quantity - amountToAdd,
                        uid: `${itemDefinition.id}_${Date.now()}`,
                    };
                    currentItems.push(newItem);
                }
            } else {
                const newItem = {
                    ...itemDefinition,
                    quantity,
                    uid: `${itemDefinition.id}_${Date.now()}`,
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

    async function removeItem(player: alt.Player, itemName: keyof RebarItems, quantity: number = 1): Promise<boolean> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            let currentItems = [...(rebarDocument.get().items || [])];
            let remainingToRemove = quantity;

            currentItems = currentItems.reduce((acc: Item[], item) => {
                if (item.name !== itemName || remainingToRemove <= 0) {
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
            const items = rebarDocument.items?.map((item) => ({ ...item })) || [];

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

    function getItemImage(itemName: string) {
        return ItemManager.useItemManager().getBaseItem(itemName)?.icon || '';
    }

    const inventoryAPI = {
        addItem,
        removeItem,
        hasItem,
        getItemCount,
        canAddItem,
        getTotalWeight,
        updateInventoryWebview,
        getItemImage,
    };

    useApi().register('inventory-api', inventoryAPI);
}

initializeInventoryAPI();

declare global {
    export interface ServerPlugin {
        ['inventory-api']: {
            addItem: (player: alt.Player, itemName: string, quantity: number) => Promise<boolean>;
            removeItem: (player: alt.Player, itemName: string, quantity: number) => Promise<boolean>;
            hasItem: (player: alt.Player, itemName: string) => boolean;
            getItemCount: (player: alt.Player, itemName: string) => number;
            canAddItem: (player: alt.Player, item: Item) => boolean;
            getTotalWeight: (items: Item[]) => number;
            updateInventoryWebview: (player: alt.Player) => void;
            getItemImage: (itemName: string) => string;
        };
    }
}
