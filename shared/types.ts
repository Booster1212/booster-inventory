import { Item } from '@Shared/types/items.js';

// types.ts
export interface ItemMetadata {
    condition?: number;
    ammo?: number;
    maxAmmo?: number;
    healing?: number;
    durability?: number;
    success_rate?: number;
    protection?: number;
}

export interface InventoryItem {
    id: number;
    name: string;
    type: 'weapon' | 'medical' | 'tool' | 'armor' | 'clothing' | 'headwear';
    amount: number;
    weight: number;
    description: string;
    image: string;
    metadata: ItemMetadata;
    hotkey?: number; // New field for toolbar slots
}

export interface EquipmentSlot {
    id: string; // Unique identifier for the slot
    name: string; // Display name of the slot
    icon: string; // Emoji or icon path for empty slot
    item: Item | null; // Currently equipped item or null if empty
    allowedTypes?: string[]; // Optional array of item types that can be equipped in this slot
}

// Example of predefined equipment slot types
export enum EquipmentSlotType {
    HEAD = 'head',
    FACE = 'face',
    TORSO = 'torso',
    BODY_ARMOR = 'body_armor',
    HANDS = 'hands',
    LEGS = 'legs',
    FEET = 'feet',
    ACCESSORY = 'accessory',
}

// Default equipment slots configuration
export const DEFAULT_EQUIPMENT_SLOTS: EquipmentSlot[] = [
    { id: EquipmentSlotType.HEAD, name: 'Headwear', icon: '🎩', item: null, allowedTypes: ['helmet', 'hat'] },
    { id: EquipmentSlotType.FACE, name: 'Face', icon: '🕶️', item: null, allowedTypes: ['mask', 'glasses'] },
    { id: EquipmentSlotType.TORSO, name: 'Torso', icon: '👕', item: null, allowedTypes: ['shirt', 'jacket'] },
    { id: EquipmentSlotType.BODY_ARMOR, name: 'Body Armor', icon: '🛡️', item: null, allowedTypes: ['armor'] },
    { id: EquipmentSlotType.HANDS, name: 'Hands', icon: '🧤', item: null, allowedTypes: ['gloves'] },
    { id: EquipmentSlotType.LEGS, name: 'Legs', icon: '👖', item: null, allowedTypes: ['pants'] },
    { id: EquipmentSlotType.FEET, name: 'Feet', icon: '👞', item: null, allowedTypes: ['shoes', 'boots'] },
    {
        id: EquipmentSlotType.ACCESSORY,
        name: 'Accessory',
        icon: '⌚',
        item: null,
        allowedTypes: ['accessory', 'jewelry', 'watch'],
    },
];

// Helper type for equipment state management
export interface EquipmentState {
    slots: EquipmentSlot[];
    totalArmorRating?: number;
    totalWeight?: number;
}

// Helper functions
export const isItemEquippable = (item: Item, slot: EquipmentSlot): boolean => {
    if (!slot.allowedTypes || slot.allowedTypes.length === 0) return true;
    return slot.allowedTypes.includes(item.data.type as string);
};

export const calculateTotalArmorRating = (slots: EquipmentSlot[]): number => {
    return slots.reduce((total, slot) => {
        if (slot.item?.data?.armorRating) {
            return total + slot.item.data.armorRating;
        }
        return total;
    }, 0);
};

export const calculateTotalEquipmentWeight = (slots: EquipmentSlot[]): number => {
    return slots.reduce((total, slot) => {
        if (slot.item?.weight) {
            return total + slot.item.weight;
        }
        return total;
    }, 0);
};
