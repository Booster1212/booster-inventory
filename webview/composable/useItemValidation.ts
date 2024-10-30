import { Item } from '@Shared/types/items.js';

export function useItemValidation() {
    const requiredItemProperties = ['uid', 'id', 'name', 'weight', 'quantity', 'maxStack', 'icon'] as const;

    const isValidItem = (item: unknown): item is Item => {
        if (!item || typeof item !== 'object') return false;
        return requiredItemProperties.every((prop) => {
            const value = (item as any)[prop];
            return value !== undefined && value !== null;
        });
    };

    const getItemType = (item: Item | null): string => {
        if (!item?.id) return 'Unknown';
        if (item.id.toString().includes('weapon')) return 'Weapon';
        if (item.id.toString().includes('medical')) return 'Medical';
        if (item.id.toString().includes('armor')) return 'Armor';
        if (item.id.toString().includes('food')) return 'Food';
        if (item.id.toString().includes('tool')) return 'Tool';
        return 'Item';
    };

    const validateItemStack = (item: Item | null, quantity: number): boolean => {
        if (!item) return false;
        return quantity > 0 && quantity <= item.maxStack;
    };

    const validateItemCondition = (item: Item | null): boolean => {
        if (!item) return false;
        return item.data?.condition ? item.data.condition > 0 : true;
    };

    const formatItemValue = (key: string, value: any): string => {
        if (!value) return '';
        if (key === 'condition') return `${value}%`;
        if (key === 'healing') return `+${value} HP`;
        if (key === 'accuracy') return `${value}%`;
        return value.toString();
    };

    const getValueColorClass = (key: string, value: any): string => {
        if (!value) return 'text-gray-400';
        if (key === 'condition') {
            if (value > 80) return 'text-green-400';
            if (value > 50) return 'text-yellow-400';
            return 'text-red-400';
        }
        return 'text-white';
    };

    const formatPropertyKey = (key: string): string => {
        if (!key) return '';
        return key
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const validateItemData = (item: Item | null): boolean => {
        if (!item?.data) return false;

        const requiredDataProperties = {
            weapon: ['condition', 'ammo', 'accuracy'],
            medical: ['healing'],
            armor: ['protection', 'durability'],
            food: ['healing'],
        };

        const itemType = getItemType(item).toLowerCase();
        const required = requiredDataProperties[itemType as keyof typeof requiredDataProperties];

        if (!required) return true;
        return required.every((prop) => prop in item.data);
    };

    const canItemsStack = (item1: Item | null, item2: Item | null): boolean => {
        if (!item1 || !item2) return false;
        if (!isValidItem(item1) || !isValidItem(item2)) return false;
        if (item1.uid === item2.uid) return false;
        if (item1.id !== item2.id) return false;
        return item1.quantity < item1.maxStack || item2.quantity < item2.maxStack;
    };

    return {
        isValidItem,
        getItemType,
        validateItemStack,
        validateItemCondition,
        formatItemValue,
        getValueColorClass,
        formatPropertyKey,
        validateItemData,
        canItemsStack,
    };
}
