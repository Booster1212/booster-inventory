import { InventoryConfig } from '../../shared/config.js';
import { Item } from '@Shared/types/items.js';
import { computed, Ref } from 'vue';
import { useItemValidation } from './useItemValidation.js';

export function useWeightManagement(items: Ref<Item[]>) {
    const { isValidItem } = useItemValidation();

    const totalWeight = computed(() => {
        return items.value.reduce((acc, item) => {
            if (!item || !isValidItem(item)) return acc;
            const itemWeight = item.weight * item.quantity;
            return acc + itemWeight;
        }, 0);
    });

    const formattedTotalWeight = computed(() => {
        return totalWeight.value.toFixed(1);
    });

    const maxWeight = computed(() => {
        return InventoryConfig.itemManager.weight.maxWeight;
    });

    const weightPercentage = computed(() => {
        return Math.min((totalWeight.value / maxWeight.value) * 100, 100);
    });

    const isOverweight = computed(() => {
        return totalWeight.value > maxWeight.value;
    });

    const availableWeight = computed(() => {
        return Math.max(0, maxWeight.value - totalWeight.value);
    });

    const canAddItem = (item: Item | null, quantity: number = 1): boolean => {
        if (!item || !isValidItem(item)) return false;
        const newWeight = totalWeight.value + item.weight * quantity;
        return newWeight <= maxWeight.value;
    };

    const getWeightStatus = () => {
        if (isOverweight.value) {
            return {
                status: 'overweight',
                message: 'Carrying too much weight',
                color: 'red',
                movementPenalty: InventoryConfig.overweightDebuff.movementPenalty,
            };
        }

        const percentageUsed = (totalWeight.value / maxWeight.value) * 100;
        if (percentageUsed >= 90) {
            return {
                status: 'heavy',
                message: 'Almost at capacity',
                color: 'yellow',
                movementPenalty: 1,
            };
        }

        return {
            status: 'normal',
            message: 'Normal weight',
            color: 'blue',
            movementPenalty: 1,
        };
    };

    const calculateStackWeight = (item: Item | null, quantity: number): number => {
        if (!item || !isValidItem(item)) return 0;
        return item.weight * quantity;
    };

    const getWeightImpact = (
        item: Item | null,
        quantity: number = 1,
    ): {
        canAdd: boolean;
        newTotal: number;
        remaining: number;
    } => {
        if (!item || !isValidItem(item)) {
            return {
                canAdd: false,
                newTotal: totalWeight.value,
                remaining: maxWeight.value - totalWeight.value,
            };
        }

        const stackWeight = calculateStackWeight(item, quantity);
        const newTotal = totalWeight.value + stackWeight;

        return {
            canAdd: newTotal <= maxWeight.value,
            newTotal,
            remaining: maxWeight.value - newTotal,
        };
    };

    return {
        totalWeight,
        formattedTotalWeight,
        maxWeight,
        weightPercentage,
        isOverweight,
        availableWeight,
        canAddItem,
        getWeightStatus,
        calculateStackWeight,
        getWeightImpact,
    };
}
