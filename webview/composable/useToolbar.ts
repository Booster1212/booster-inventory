import { Item } from '@Shared/types/items.js';
import { ref } from 'vue';
import { useItemValidation } from './useItemValidation.js';

export function useToolbar() {
    const { isValidItem } = useItemValidation();
    const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);
    const TOOLBAR_STORAGE_KEY = 'inventory:toolbar';

    const assignToHotkey = (item: Item | null, slot: number) => {
        if (!item || !isValidItem(item)) return false;
        if (slot < 0 || slot >= toolbarItems.value.length) return false;

        const existingSlot = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
        if (existingSlot !== -1) {
            toolbarItems.value[existingSlot] = null;
        }

        toolbarItems.value[slot] = item;
        saveToolbarToStorage();
        return true;
    };

    const removeFromHotkey = (slot: number) => {
        if (slot < 0 || slot >= toolbarItems.value.length) return false;
        toolbarItems.value[slot] = null;
        saveToolbarToStorage();
        return true;
    };

    const saveToolbarToStorage = () => {
        try {
            localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(toolbarItems.value));
            return true;
        } catch (error) {
            console.error('Error saving toolbar:', error);
            return false;
        }
    };

    const validateStoredToolbar = (stored: unknown): stored is (Item | null)[] => {
        if (!Array.isArray(stored)) return false;
        if (stored.length !== 5) return false;
        return stored.every((item) => item === null || isValidItem(item));
    };

    const loadToolbarFromStorage = () => {
        try {
            const stored = localStorage.getItem(TOOLBAR_STORAGE_KEY);
            if (!stored) return false;

            const parsed = JSON.parse(stored);
            if (!validateStoredToolbar(parsed)) {
                console.error('Invalid toolbar data in storage');
                return false;
            }

            toolbarItems.value = parsed;
            return true;
        } catch (error) {
            console.error('Error loading toolbar:', error);
            toolbarItems.value = [null, null, null, null, null];
            return false;
        }
    };

    const getHotkeyNumber = (item: Item | null): number | null => {
        if (!item || !isValidItem(item)) return null;
        const index = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
        return index !== -1 ? index + 1 : null;
    };

    const updateToolbarItem = (oldItem: Item, newItem: Item) => {
        if (!isValidItem(oldItem) || !isValidItem(newItem)) return false;
        const index = toolbarItems.value.findIndex((i) => i?.uid === oldItem.uid);
        if (index === -1) return false;

        toolbarItems.value[index] = newItem;
        saveToolbarToStorage();
        return true;
    };

    const syncToolbarWithInventory = (inventoryItems: Array<Item | null>) => {
        toolbarItems.value = toolbarItems.value.map((toolbarItem) => {
            if (!toolbarItem) return null;
            const updatedItem = inventoryItems.find((item) => item?.uid === toolbarItem.uid);
            return updatedItem || null;
        });
        saveToolbarToStorage();
    };

    const clearToolbar = () => {
        toolbarItems.value = [null, null, null, null, null];
        saveToolbarToStorage();
    };

    return {
        toolbarItems,
        assignToHotkey,
        removeFromHotkey,
        saveToolbarToStorage,
        loadToolbarFromStorage,
        getHotkeyNumber,
        updateToolbarItem,
        syncToolbarWithInventory,
        clearToolbar,
    };
}
