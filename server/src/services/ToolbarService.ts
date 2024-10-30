import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Item } from '@Shared/types/items.js';
import { InventoryEvents } from '../../../shared/events.js';
import { useWebview } from '@Server/player/webview.js';
import { inventoryService } from './InventoryService.js';

const Rebar = useRebar();

export interface ToolbarOperationResult {
    success: boolean;
    toolbar: Array<Item | null>;
    error?: string;
}

class ToolbarService {
    private async updatePlayerToolbar(
        player: alt.Player,
        toolbar: Array<Item | null>,
        emitUpdate: boolean = true,
    ): Promise<boolean> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            rebarDocument.set('toolbar', toolbar);

            if (emitUpdate) {
                const Webview = useWebview(player);
                Webview.emit(InventoryEvents.Webview.Inventory_UpdateToolbar, toolbar);
            }

            return true;
        } catch (error) {
            console.error('Error updating player toolbar:', error);
            return false;
        }
    }

    public async handleAssignToToolbar(player: alt.Player, item: Item, slot: number): Promise<ToolbarOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentToolbar = [...(rebarDocument.get().toolbar || new Array(5).fill(null))];
            const currentInventory = [...(rebarDocument.get().items || [])];

            if (slot < 0 || slot >= currentToolbar.length) {
                return { success: false, toolbar: currentToolbar, error: 'Invalid slot' };
            }

            const itemIndex = currentInventory.findIndex((invItem) => invItem.uid === item.uid);
            if (itemIndex === -1) {
                return { success: false, toolbar: currentToolbar, error: 'Item not found in inventory' };
            }

            const newInventory = currentInventory.filter((invItem) => invItem.uid !== item.uid);
            const existingItem = currentToolbar[slot];
            if (existingItem) {
                newInventory.push(existingItem);
            }

            const newToolbar = [...currentToolbar];
            newToolbar[slot] = item;

            await Promise.all([
                this.updatePlayerToolbar(player, newToolbar),
                inventoryService.updatePlayerInventory(player, newInventory),
            ]);

            return { success: true, toolbar: newToolbar };
        } catch (error) {
            console.error('Assign to toolbar error:', error);
            return { success: false, toolbar: [], error: 'Internal error' };
        }
    }

    public async handleRemoveFromToolbar(player: alt.Player, slotIndex: number): Promise<ToolbarOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentToolbar = [...(rebarDocument.get().toolbar || new Array(5).fill(null))];
            const currentInventory = [...(rebarDocument.get().items || [])];

            if (slotIndex < 0 || slotIndex >= currentToolbar.length) {
                return { success: false, toolbar: currentToolbar, error: 'Invalid slot' };
            }

            const itemToRemove = currentToolbar[slotIndex];
            if (!itemToRemove) {
                return { success: false, toolbar: currentToolbar, error: 'No item in slot' };
            }

            const newToolbar = [...currentToolbar];
            newToolbar[slotIndex] = null;

            const newInventory = [...currentInventory, itemToRemove];

            await Promise.all([
                this.updatePlayerToolbar(player, newToolbar),
                inventoryService.updatePlayerInventory(player, newInventory),
            ]);

            return { success: true, toolbar: newToolbar };
        } catch (error) {
            console.error('Remove from toolbar error:', error);
            return { success: false, toolbar: [], error: 'Internal error' };
        }
    }

    public async handleSwapToolbarItems(
        player: alt.Player,
        fromSlot: number,
        toSlot: number,
    ): Promise<ToolbarOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentToolbar = [...(rebarDocument.get().toolbar || new Array(5).fill(null))];

            if (fromSlot < 0 || toSlot < 0 || fromSlot >= currentToolbar.length || toSlot >= currentToolbar.length) {
                return { success: false, toolbar: currentToolbar, error: 'Invalid slot' };
            }

            const newToolbar = [...currentToolbar];
            [newToolbar[fromSlot], newToolbar[toSlot]] = [newToolbar[toSlot], newToolbar[fromSlot]];

            await this.updatePlayerToolbar(player, newToolbar);
            return { success: true, toolbar: newToolbar };
        } catch (error) {
            console.error('Swap toolbar items error:', error);
            return { success: false, toolbar: [], error: 'Internal error' };
        }
    }

    public async initializePlayerToolbar(player: alt.Player): Promise<void> {
        const rebarDocument = Rebar.document.character.useCharacter(player);
        const characterData = rebarDocument.get();

        if (!characterData.toolbar) {
            await this.updatePlayerToolbar(player, new Array(5).fill(null), true);
        }
    }
}

export const toolbarService = new ToolbarService();
