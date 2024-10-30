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
    hotkey?: number;
}

export interface EquipmentSlot {
    id: string; // Unique identifier for the slot
    name: string; // Display name of the slot
    icon: string; // Emoji or icon path for empty slot
    item: Item | null; // Currently equipped item or null if empty
    allowedTypes?: string[]; // Optional array of item types that can be equipped in this slot
}

export enum EquipmentSlotType {
    MASKS = 'masks',
    LEGS = 'legs',
    BAGS = 'bags',
    SHOES = 'shoes',
    ACCESSORIES = 'accessories',
    UNDERSHIRTS = 'undershirts',
    BODY_ARMORS = 'body_armors',
    DECALS = 'decals',
    TOPS = 'tops',
    HATS = 'hats',
    GLASSES = 'glasses',
    EARS = 'ears',
    WATCHES = 'watches',
    BRACELETS = 'bracelets',
}

export const DEFAULT_EQUIPMENT_SLOTS: EquipmentSlot[] = [
    { id: EquipmentSlotType.MASKS, name: 'Masks', icon: '🎭', item: null, allowedTypes: ['mask'] },
    { id: EquipmentSlotType.TOPS, name: 'Tops', icon: '👔', item: null, allowedTypes: ['top'] },
    { id: EquipmentSlotType.UNDERSHIRTS, name: 'Undershirts', icon: '👚', item: null, allowedTypes: ['undershirt'] },
    { id: EquipmentSlotType.BODY_ARMORS, name: 'Body Armors', icon: '🛡️', item: null, allowedTypes: ['armor'] },
    { id: EquipmentSlotType.LEGS, name: 'Legs', icon: '👖', item: null, allowedTypes: ['pants'] },
    { id: EquipmentSlotType.SHOES, name: 'Shoes', icon: '👞', item: null, allowedTypes: ['shoes', 'boots'] },
    // { id: EquipmentSlotType.DECALS, name: 'Decals', icon: '🎨', item: null, allowedTypes: ['decal'] },
    { id: EquipmentSlotType.ACCESSORIES, name: 'Accessories', icon: '⌚', item: null, allowedTypes: ['accessory'] },
    {
        id: EquipmentSlotType.BAGS,
        name: 'Bags & Parachutes',
        icon: '🎒',
        item: null,
        allowedTypes: ['bag', 'parachute'],
    },
    // Props
    { id: EquipmentSlotType.HATS, name: 'Hats', icon: '🎩', item: null, allowedTypes: ['hat'] },
    { id: EquipmentSlotType.GLASSES, name: 'Glasses', icon: '🕶️', item: null, allowedTypes: ['glasses'] },
    { id: EquipmentSlotType.EARS, name: 'Ears', icon: '👂', item: null, allowedTypes: ['ear accessory'] },
    { id: EquipmentSlotType.WATCHES, name: 'Watches', icon: '⌚', item: null, allowedTypes: ['watch'] },
    { id: EquipmentSlotType.BRACELETS, name: 'Bracelets', icon: '📿', item: null, allowedTypes: ['bracelet'] },
];

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
