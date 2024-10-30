import { DEFAULT_EQUIPMENT_SLOTS, EquipmentSlot } from '../../shared/types.js';
import { Item } from '@Shared/types/items.js';
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { InventoryEvents } from '../../shared/events.js';
import { useItemValidation } from './useItemValidation.js';

export function useEquipment() {
    const { isValidItem } = useItemValidation();
    const events = useEvents();
    const equipmentSlots = ref<EquipmentSlot[]>(DEFAULT_EQUIPMENT_SLOTS);

    // const equipmentState = computed<EquipmentState>(() => {
    //     const totalArmorRating = equipmentSlots.value.reduce((total, slot) => {
    //         if (slot.item?.data?.armorRating) {
    //             return total + slot.item.data.armorRating;
    //         }
    //         return total;
    //     }, 0);

    //     const totalWeight = equipmentSlots.value.reduce((total, slot) => {
    //         if (slot.item?.weight) {
    //             return total + slot.item.weight;
    //         }
    //         return total;
    //     }, 0);

    //     return {
    //         slots: equipmentSlots.value,
    //         totalArmorRating,
    //         totalWeight,
    //     };
    // });

    const isSlotEmpty = (slotId: string): boolean => {
        const slot = equipmentSlots.value.find((s) => s.id === slotId);
        return !slot?.item;
    };

    const canEquipItem = (item: Item, slotId: string): boolean => {
        if (!isValidItem(item)) return false;
        const slot = equipmentSlots.value.find((s) => s.id === slotId);
        if (!slot) return false;

        if (!slot.allowedTypes || slot.allowedTypes.length === 0) return true;
        return slot.allowedTypes.includes(item.data.type as string);
    };

    const equipItem = async (item: Item, slotId: string): Promise<boolean> => {
        if (!canEquipItem(item, slotId)) return false;

        await events.emitServer(InventoryEvents.Server.Inventory_EquipItem, item, slotId);
        const slotIndex = equipmentSlots.value.findIndex((s) => s.id === slotId);
        if (slotIndex === -1) return false;

        equipmentSlots.value[slotIndex] = {
            ...equipmentSlots.value[slotIndex],
            item,
        };

        return true;
    };

    const unequipItem = async (slotId: string): Promise<Item | null> => {
        const slotIndex = equipmentSlots.value.findIndex((s) => s.id === slotId);
        if (slotIndex === -1) return null;

        const unequippedItem = equipmentSlots.value[slotIndex].item;
        if (!unequippedItem) return null;

        await events.emitServer(InventoryEvents.Server.Inventory_UnequipItem, slotId);
        equipmentSlots.value[slotIndex] = {
            ...equipmentSlots.value[slotIndex],
            item: null,
        };

        return unequippedItem;
    };

    const getEquippedItem = (slotId: string): Item | null => {
        const slot = equipmentSlots.value.find((s) => s.id === slotId);
        return slot?.item || null;
    };

    const clearAllEquipment = async () => {
        const promises = equipmentSlots.value.map((slot) => {
            if (slot.item) {
                return events.emitServer(InventoryEvents.Server.Inventory_UnequipItem, slot.id);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
        equipmentSlots.value = equipmentSlots.value.map((slot) => ({
            ...slot,
            item: null,
        }));
    };

    const loadEquipment = async () => {
        try {
            const result = await events.emitServerRpc(InventoryEvents.RPC.Inventory_GetEquipment);
            if (Array.isArray(result)) {
                equipmentSlots.value = result;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading equipment:', error);
            return false;
        }
    };

    const getEquippedItems = (): Item[] => {
        return equipmentSlots.value
            .filter((slot) => slot.item !== null)
            .map((slot) => slot.item!)
            .filter(isValidItem);
    };

    const hasEquippedItem = (itemId: string): boolean => {
        return equipmentSlots.value.some((slot) => slot.item?.id === itemId);
    };

    events.on(InventoryEvents.Webview.Inventory_UpdateEquipment, (slots: Array<EquipmentSlot>) => {
        equipmentSlots.value = slots;
    });

    return {
        equipmentSlots,
        isSlotEmpty,
        canEquipItem,
        equipItem,
        unequipItem,
        getEquippedItem,
        clearAllEquipment,
        loadEquipment,
        getEquippedItems,
        hasEquippedItem,
    };
}
