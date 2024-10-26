import { DEFAULT_EQUIPMENT_SLOTS, EquipmentSlot, EquipmentState } from '../../shared/types.js';
import { Item } from '@Shared/types/items.js';
import { ref, computed } from 'vue';

export function useEquipment() {
    const equipmentSlots = ref<EquipmentSlot[]>(DEFAULT_EQUIPMENT_SLOTS);

    const equipmentState = computed<EquipmentState>(() => {
        const totalArmorRating = equipmentSlots.value.reduce((total, slot) => {
            if (slot.item?.data?.armorRating) {
                return total + slot.item.data.armorRating;
            }
            return total;
        }, 0);

        const totalWeight = equipmentSlots.value.reduce((total, slot) => {
            if (slot.item?.weight) {
                return total + slot.item.weight;
            }
            return total;
        }, 0);

        return {
            slots: equipmentSlots.value,
            totalArmorRating,
            totalWeight,
        };
    });

    const isSlotEmpty = (slotId: string): boolean => {
        const slot = equipmentSlots.value.find((s) => s.id === slotId);
        return !slot?.item;
    };

    const canEquipItem = (item: Item, slotId: string): boolean => {
        const slot = equipmentSlots.value.find((s) => s.id === slotId);
        if (!slot) return false;

        if (!slot.allowedTypes || slot.allowedTypes.length === 0) return true;
        return slot.allowedTypes.includes(item.data.type as string);
    };

    const equipItem = (item: Item, slotId: string): boolean => {
        if (!canEquipItem(item, slotId)) return false;

        const slotIndex = equipmentSlots.value.findIndex((s) => s.id === slotId);
        if (slotIndex === -1) return false;

        equipmentSlots.value[slotIndex] = {
            ...equipmentSlots.value[slotIndex],
            item,
        };

        return true;
    };

    const unequipItem = (slotId: string): Item | null => {
        const slotIndex = equipmentSlots.value.findIndex((s) => s.id === slotId);
        if (slotIndex === -1) return null;

        const unequippedItem = equipmentSlots.value[slotIndex].item;
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

    const clearAllEquipment = () => {
        equipmentSlots.value = equipmentSlots.value.map((slot) => ({
            ...slot,
            item: null,
        }));
    };

    const getEquippedItems = (): Item[] => {
        return equipmentSlots.value.filter((slot) => slot.item !== null).map((slot) => slot.item!);
    };

    const hasEquippedItem = (itemId: string): boolean => {
        return equipmentSlots.value.some((slot) => slot.item?.id === itemId);
    };

    return {
        equipmentSlots,
        equipmentState,
        isSlotEmpty,
        canEquipItem,
        equipItem,
        unequipItem,
        getEquippedItem,
        clearAllEquipment,
        getEquippedItems,
        hasEquippedItem,
    };
}
