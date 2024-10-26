import { useEvents } from '@Composables/useEvents.js';
import { InventoryConfig } from '../../shared/config.js';
import { InventoryEvents } from '../../shared/events.js';
import { Item } from '@Shared/types/items.js';
import { ref, computed } from 'vue';
import { useItemValidation } from './useItemValidation.js';

export function useInventory() {
    const { isValidItem } = useItemValidation();
    const events = useEvents();
    const inventory = ref<Item[]>([]);
    const itemPositions = ref<Record<string, number>>({});
    const selectedItem = ref<Item | null>(null);

    const validateInventoryItem = (item: unknown): item is Item => {
        return isValidItem(item);
    };

    const updateInventory = (items: Item[]) => {
        if (!Array.isArray(items)) return false;
        const validItems = items.filter(validateInventoryItem);

        inventory.value = validItems;
        validItems.forEach((item, index) => {
            if (!(item.uid in itemPositions.value)) {
                itemPositions.value[item.uid] = index;
            }
        });

        itemPositions.value = fixItemPositions(inventoryWithNulls.value);
        saveInventoryPositions();
        return true;
    };

    const findFirstAvailableSlot = (slots: Array<Item | null>): number => {
        return slots.findIndex((slot) => slot === null);
    };

    const fixItemPositions = (slots: Array<Item | null>): Record<string, number> => {
        const newPositions: Record<string, number> = {};
        const seenItems = new Set<string>();

        slots.forEach((item, index) => {
            if (!item || !validateInventoryItem(item) || seenItems.has(item.uid)) return;
            newPositions[item.uid] = index;
            seenItems.add(item.uid);
        });

        return newPositions;
    };

    const inventoryWithNulls = computed(() => {
        const result = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
        const usedPositions = new Set<number>();

        inventory.value.forEach((item) => {
            if (!validateInventoryItem(item)) return;

            let position = itemPositions.value[item.uid];

            if (position === undefined || position >= result.length || usedPositions.has(position)) {
                position = findFirstAvailableSlot(result);
            }

            if (position !== -1 && !usedPositions.has(position)) {
                result[position] = item;
                usedPositions.add(position);
                itemPositions.value[item.uid] = position;
            }
        });

        itemPositions.value = fixItemPositions(result);
        return result;
    });

    const INVENTORY_POSITIONS_KEY = 'inventory:positions';

    const saveInventoryPositions = () => {
        try {
            localStorage.setItem(INVENTORY_POSITIONS_KEY, JSON.stringify(itemPositions.value));
            return true;
        } catch (error) {
            console.error('Error saving inventory positions:', error);
            return false;
        }
    };

    const loadInventoryPositions = () => {
        try {
            const stored = localStorage.getItem(INVENTORY_POSITIONS_KEY);
            if (!stored) return false;

            const parsed = JSON.parse(stored);
            if (typeof parsed !== 'object') return false;

            itemPositions.value = parsed;
            return true;
        } catch (error) {
            console.error('Error loading inventory positions:', error);
            itemPositions.value = {};
            return false;
        }
    };

    const useItem = (item: Item | null) => {
        if (!item || !validateInventoryItem(item)) return false;
        events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
        return true;
    };

    const dropItem = (item: Item | null) => {
        if (!item || !validateInventoryItem(item)) return false;
        events.emitServer(InventoryEvents.Server.Inventory_DropItem, item);
        return true;
    };

    const handleSwapItems = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return false;
        if (fromIndex < 0 || toIndex < 0) return false;
        if (fromIndex >= inventoryWithNulls.value.length || toIndex >= inventoryWithNulls.value.length) return false;

        const fromItem = inventoryWithNulls.value[fromIndex];
        const toItem = inventoryWithNulls.value[toIndex];

        if (fromItem && toItem && fromItem.id === toItem.id && fromItem.uid !== toItem.uid) {
            return handleStackItems(toItem.uid, fromItem.uid);
        }

        const newPositions = { ...itemPositions.value };

        if (fromItem) newPositions[fromItem.uid] = toIndex;
        if (toItem) newPositions[toItem.uid] = fromIndex;

        itemPositions.value = newPositions;
        saveInventoryPositions();
        return true;
    };

    const handleStackItems = (uidToStackOn: string, uidToStack: string) => {
        if (uidToStackOn === uidToStack) return false;
        events.emitServer(InventoryEvents.Server.Inventory_StackItems, uidToStackOn, uidToStack);
        return true;
    };

    const handleUpdatePositions = (newArray: (Item | null)[]) => {
        itemPositions.value = fixItemPositions(newArray);
        return saveInventoryPositions();
    };

    const loadInventory = async () => {
        try {
            const result = await events.emitServerRpc(InventoryEvents.Server.Inventory_RequestItems);
            if (Array.isArray(result)) {
                return updateInventory(result);
            }
            return false;
        } catch (error) {
            console.error('Error loading inventory:', error);
            return false;
        }
    };

    return {
        inventory,
        inventoryWithNulls,
        selectedItem,
        itemPositions,
        validateInventoryItem,
        useItem,
        dropItem,
        handleSwapItems,
        handleStackItems,
        handleUpdatePositions,
        loadInventory,
        saveInventoryPositions,
        loadInventoryPositions,
        updateInventory,
        findFirstAvailableSlot,
    };
}