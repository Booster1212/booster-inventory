import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Item } from '@Shared/types/items.js';
import { InventoryConfig } from '../../../shared/config.js';
import { InventoryEvents } from '../../../shared/events.js';
import { useWebview } from '@Server/player/webview.js';

const Rebar = useRebar();

export interface InventoryOperationResult {
    success: boolean;
    inventory: Item[];
    error?: string;
}

class InventoryService {
    private validateInventoryOperation(oldInventory: Item[], newInventory: Item[]): boolean {
        const oldTotal = oldInventory.reduce((sum, item) => sum + item.quantity, 0);
        const newTotal = newInventory.reduce((sum, item) => sum + item.quantity, 0);
        if (oldTotal !== newTotal) return false;

        const oldWeight = oldInventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
        const newWeight = newInventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
        return oldWeight === newWeight;
    }

    public createInventoryWithEmptySlots(items: Item[]): Array<Item | null> {
        const slots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
        items.forEach((item, index) => {
            if (index < slots.length) {
                slots[index] = { ...item };
            }
        });
        return slots;
    }

    public async updatePlayerInventory(player: alt.Player, inventory: Item[]): Promise<boolean> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            rebarDocument.set('items', inventory);

            const Webview = useWebview(player);
            const inventoryWithSlots = this.createInventoryWithEmptySlots(inventory);
            Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithSlots);

            return true;
        } catch (error) {
            console.error('Error updating player inventory:', error);
            return false;
        }
    }

    public async handleSwapItems(
        player: alt.Player,
        fromIndex: number,
        toIndex: number,
    ): Promise<InventoryOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentItems = [...(rebarDocument.get().items || [])];
            const inventory = this.createInventoryWithEmptySlots(currentItems);

            if (fromIndex < 0 || toIndex < 0 || fromIndex >= inventory.length || toIndex >= inventory.length) {
                return { success: false, inventory: currentItems, error: 'Invalid index' };
            }

            [inventory[fromIndex], inventory[toIndex]] = [inventory[toIndex], inventory[fromIndex]];
            const newInventory = inventory.filter((item) => item !== null);

            if (!this.validateInventoryOperation(currentItems, newInventory)) {
                return { success: false, inventory: currentItems, error: 'Invalid operation' };
            }

            await this.updatePlayerInventory(player, newInventory);
            return { success: true, inventory: newInventory };
        } catch (error) {
            console.error('Swap items error:', error);
            return { success: false, inventory: [], error: 'Internal error' };
        }
    }

    public async handleStackItems(
        player: alt.Player,
        uidToStackOn: string,
        uidToStack: string,
    ): Promise<InventoryOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const inventory = [...rebarDocument.get().items];

            const targetItemIndex = inventory.findIndex((item) => item.uid === uidToStackOn);
            const sourceItemIndex = inventory.findIndex((item) => item.uid === uidToStack);

            if (targetItemIndex === -1 || sourceItemIndex === -1) {
                return { success: false, inventory, error: 'Items not found' };
            }

            const targetItem = { ...inventory[targetItemIndex] };
            const sourceItem = { ...inventory[sourceItemIndex] };

            if (targetItem.id !== sourceItem.id) {
                return { success: false, inventory, error: 'Items cannot be stacked' };
            }

            const availableSpace = targetItem.maxStack - targetItem.quantity;
            if (availableSpace <= 0) {
                return { success: false, inventory, error: 'Target stack is full' };
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

            if (!this.validateInventoryOperation(inventory, newInventory)) {
                return { success: false, inventory, error: 'Invalid operation' };
            }

            await this.updatePlayerInventory(player, newInventory);
            return { success: true, inventory: newInventory };
        } catch (error) {
            console.error('Stack items error:', error);
            return { success: false, inventory: [], error: 'Internal error' };
        }
    }

    public async handleSplitItems(
        player: alt.Player,
        uid: string,
        quantity: number,
    ): Promise<InventoryOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const inventory = [...rebarDocument.get().items];

            const sourceItemIndex = inventory.findIndex((item) => item.uid === uid);
            if (sourceItemIndex === -1) {
                return { success: false, inventory, error: 'Item not found' };
            }

            const sourceItem = inventory[sourceItemIndex];
            if (quantity <= 0 || quantity >= sourceItem.quantity) {
                return { success: false, inventory, error: 'Invalid quantity' };
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

            if (!this.validateInventoryOperation(inventory, newInventory)) {
                return { success: false, inventory, error: 'Invalid operation' };
            }

            await this.updatePlayerInventory(player, newInventory);
            return { success: true, inventory: newInventory };
        } catch (error) {
            console.error('Split items error:', error);
            return { success: false, inventory: [], error: 'Internal error' };
        }
    }
}

export const inventoryService = new InventoryService();
