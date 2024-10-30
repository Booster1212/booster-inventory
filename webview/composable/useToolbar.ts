import { Item } from '@Shared/types/items.js';
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { InventoryEvents } from '../../shared/events.js';
import { useItemValidation } from './useItemValidation.js';

export function useToolbar() {
    const { isValidItem } = useItemValidation();
    const events = useEvents();
    const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);

    const assignToHotkey = async (item: Item | null, slot: number): Promise<boolean> => {
        if (!item || !isValidItem(item)) return false;
        if (slot < 0 || slot >= toolbarItems.value.length) return false;

        try {
            events.emitServer(InventoryEvents.Server.Inventory_AssignToToolbar, item, slot);

            toolbarItems.value[slot] = item;
            return true;
        } catch (error) {
            console.error('Error assigning hotkey:', error);
            return false;
        }
    };

    const removeFromHotkey = async (slot: number): Promise<boolean> => {
        if (slot < 0 || slot >= toolbarItems.value.length) return false;
        if (!toolbarItems.value[slot]) return false;

        try {
            events.emitServer(InventoryEvents.Server.Inventory_RemoveFromToolbar, slot);

            toolbarItems.value[slot] = null;
            return true;
        } catch (error) {
            console.error('Error removing hotkey:', error);
            return false;
        }
    };

    const getHotkeyNumber = (item: Item | null): number | null => {
        if (!item || !isValidItem(item)) return null;
        const index = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
        return index !== -1 ? index + 1 : null;
    };

    const updateToolbarItem = async (oldItem: Item, newItem: Item): Promise<boolean> => {
        if (!isValidItem(oldItem) || !isValidItem(newItem)) return false;
        const index = toolbarItems.value.findIndex((i) => i?.uid === oldItem.uid);
        if (index === -1) return false;

        try {
            events.emitServer(InventoryEvents.Server.Inventory_AssignToToolbar, newItem, index);
            toolbarItems.value[index] = newItem;
            return true;
        } catch (error) {
            console.error('Error updating toolbar item:', error);
            return false;
        }
    };

    const loadToolbar = async (): Promise<boolean> => {
        try {
            const result = await events.emitServerRpc(InventoryEvents.RPC.Inventory_GetToolbar);
            if (Array.isArray(result)) {
                toolbarItems.value = result;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading toolbar:', error);
            return false;
        }
    };

    const clearToolbar = async (): Promise<boolean> => {
        try {
            const promises = toolbarItems.value.map((_, index) =>
                toolbarItems.value[index] ? removeFromHotkey(index) : Promise.resolve(true),
            );

            await Promise.all(promises);
            toolbarItems.value = [null, null, null, null, null];
            return true;
        } catch (error) {
            console.error('Error clearing toolbar:', error);
            return false;
        }
    };

    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (items: Array<Item | null>) => {
        toolbarItems.value = items.map((item) => (item && isValidItem(item) ? item : null));
    });

    return {
        toolbarItems,
        assignToHotkey,
        removeFromHotkey,
        getHotkeyNumber,
        updateToolbarItem,
        loadToolbar,
        clearToolbar,
    };
}
