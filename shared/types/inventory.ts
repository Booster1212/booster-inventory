import { Item } from '@Shared/types/items.js';

/**
 * Extends the base Item interface with inventory-specific properties
 */
export interface InventoryItem extends Item {
    slot?: number; // Current slot position in inventory
    lastKnownPosition?: number; // Last known slot for persistence
    isEquipped?: boolean; // Whether item is currently equipped
    toolbarSlot?: number; // Current toolbar slot if assigned
    stackId?: string; // Unique ID for stacked items
}

/**
 * Represents an item's position in any container
 */
export interface ItemPosition {
    itemId: string;
    slot: number;
    type: 'inventory' | 'toolbar' | 'equipment';
}

/**
 * Overall state of item positions
 */
export interface ItemState {
    positions: ItemPosition[];
    lastUpdate: number;
}

/**
 * Valid sources for drag operations
 */
export type DragSource = 'inventory' | 'toolbar' | 'equipment';

/**
 * State for drag operations
 */
export interface DragState {
    item: InventoryItem | null;
    sourceIndex: number | null;
    sourceType: DragSource | null;
    startPosition: { x: number; y: number };
    currentPosition: { x: number; y: number };
}

/**
 * Parameters for stack operations
 */
export interface StackOperation {
    sourceItem: InventoryItem;
    targetItem: InventoryItem;
    amount: number;
}

/**
 * Parameters for split operations
 */
export interface SplitOperation {
    item: InventoryItem;
    amount: number;
    targetSlot?: number;
}

/**
 * Type guard to check if an item is an InventoryItem
 */
export const isInventoryItem = (item: Item | null): item is InventoryItem => {
    return item !== null && 'uid' in item;
};
