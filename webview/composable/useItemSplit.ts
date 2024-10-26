import { Item } from '@Shared/types/items.js';
import { ref, computed, watch } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { InventoryEvents } from '../../shared/events.js';
import { useItemValidation } from './useItemValidation.js';

export function useItemSplit() {
    const { isValidItem } = useItemValidation();
    const events = useEvents();
    const showSplitModal = ref(false);
    const selectedItemForSplit = ref<Item | null>(null);
    const quantity = ref(1);

    const splitPresets = computed(() => {
        const item = selectedItemForSplit.value;
        if (!item || !isValidItem(item)) return [];

        const maxSplit = item.quantity - 1;
        if (maxSplit <= 0) return [];
        if (maxSplit <= 4) {
            return Array.from({ length: maxSplit }, (_, i) => i + 1);
        }
        return [1, Math.floor(maxSplit / 2), maxSplit];
    });

    const isValidQuantity = computed(() => {
        const item = selectedItemForSplit.value;
        if (!item || !isValidItem(item)) return false;
        return quantity.value >= 1 && quantity.value < item.quantity;
    });

    watch(
        () => showSplitModal.value,
        (newValue) => {
            if (!newValue) {
                selectedItemForSplit.value = null;
                quantity.value = 1;
            }
        },
    );

    const openSplitModal = (item: Item | null) => {
        if (!item || !isValidItem(item) || item.quantity <= 1) return false;
        selectedItemForSplit.value = item;
        quantity.value = 1;
        showSplitModal.value = true;
        return true;
    };

    const closeSplitModal = () => {
        showSplitModal.value = false;
    };

    const handlePresetClick = (value: number) => {
        if (validateSplitQuantity(value)) {
            quantity.value = value;
        }
    };

    const handleSliderInput = (value: number) => {
        if (validateSplitQuantity(value)) {
            quantity.value = value;
        }
    };

    const validateSplitQuantity = (qty: number): boolean => {
        const item = selectedItemForSplit.value;
        if (!item || !isValidItem(item)) return false;
        return qty > 0 && qty < item.quantity;
    };

    const handleSplitItem = (item: Item | null, splitQuantity: number) => {
        if (!item || !isValidItem(item) || !validateSplitQuantity(splitQuantity)) {
            return false;
        }

        events.emitServer(InventoryEvents.Server.Inventory_SplitItems, item.uid, splitQuantity);
        closeSplitModal();
        return true;
    };

    const canItemBeSplit = (item: Item | null): boolean => {
        return item !== null && isValidItem(item) && item.quantity > 1;
    };

    return {
        showSplitModal,
        selectedItemForSplit,
        quantity,
        splitPresets,
        isValidQuantity,
        openSplitModal,
        closeSplitModal,
        handlePresetClick,
        handleSliderInput,
        validateSplitQuantity,
        handleSplitItem,
        canItemBeSplit,
    };
}
