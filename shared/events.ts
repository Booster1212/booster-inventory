import { Item } from '@Shared/types/items.js';
import { EquipmentSlot } from './types.js';

export const InventoryEvents = {
    Client: {
        Inventory_Loaded: 'inventory:loaded',
        Inventory_Error: 'inventory:error',
    },
    Server: {
        Inventory_UseItem: 'inventory:use-item',
        Inventory_RequestItems: 'inventory:request-items',
        Inventory_StackItems: 'inventory:stack-items',
        Inventory_SplitItems: 'inventory:split-items',
        Inventory_DropItem: 'inventory:drop-item',
        Inventory_SwapItems: 'inventory:swap-items',
        Inventory_AssignToToolbar: 'inventory:assign-to-toolbar',
        Inventory_RemoveFromToolbar: 'inventory:remove-from-toolbar',
        Inventory_SwapToolbarItems: 'inventory:swap-toolbar-items',
        Inventory_EquipItem: 'inventory:equip-item',
        Inventory_UnequipItem: 'inventory:unequip-item',
        Inventory_SwapEquipment: 'inventory:swap-equipment',
    },
    RPC: {
        Inventory_GetItems: 'inventory:get-items',
        Inventory_GetWeight: 'inventory:get-weight',
        Inventory_GetToolbar: 'inventory:get-toolbar',
        Inventory_GetEquipment: 'inventory:get-equipment',
    },
    Webview: {
        Inventory_UpdateItems: 'inventory:update-items',
        Inventory_UpdateToolbar: 'inventory:update-toolbar',
        Inventory_UpdateEquipment: 'inventory:update-equipment',
        Inventory_KeyPress: 'inventory:key-press',
        Inventory_Error: 'inventory:error',
        Inventory_Success: 'inventory:success',
    },
} as const;

export interface InventoryPayloads {
    [InventoryEvents.Server.Inventory_UseItem]: [item: Item];
    [InventoryEvents.Server.Inventory_RequestItems]: void;
    [InventoryEvents.Server.Inventory_StackItems]: [uidToStackOn: string, uidToStack: string];
    [InventoryEvents.Server.Inventory_SplitItems]: [uid: string, quantity: number];
    [InventoryEvents.Server.Inventory_DropItem]: [item: Item];
    [InventoryEvents.Server.Inventory_SwapItems]: [fromIndex: number, toIndex: number];
    [InventoryEvents.Server.Inventory_AssignToToolbar]: [item: Item, slot: number];
    [InventoryEvents.Server.Inventory_RemoveFromToolbar]: [slot: number];
    [InventoryEvents.Server.Inventory_SwapToolbarItems]: [fromSlot: number, toSlot: number];
    [InventoryEvents.Server.Inventory_EquipItem]: [item: Item, slotId: string];
    [InventoryEvents.Server.Inventory_UnequipItem]: [slotId: string];
    [InventoryEvents.Server.Inventory_SwapEquipment]: [fromSlotId: string, toSlotId: string];

    [InventoryEvents.Webview.Inventory_UpdateItems]: [items: Array<Item | null>];
    [InventoryEvents.Webview.Inventory_UpdateToolbar]: [items: Array<Item | null>];
    [InventoryEvents.Webview.Inventory_UpdateEquipment]: [slots: Array<EquipmentSlot>];
    [InventoryEvents.Webview.Inventory_KeyPress]: [keyNumber: number];
    [InventoryEvents.Webview.Inventory_Error]: [message: string];
    [InventoryEvents.Webview.Inventory_Success]: [message: string];

    [InventoryEvents.Client.Inventory_Loaded]: void;
    [InventoryEvents.Client.Inventory_Error]: [error: string];

    [InventoryEvents.RPC.Inventory_GetItems]: Array<Item | null>;
    [InventoryEvents.RPC.Inventory_GetWeight]: number;
    [InventoryEvents.RPC.Inventory_GetToolbar]: Array<Item | null>;
    [InventoryEvents.RPC.Inventory_GetEquipment]: Array<EquipmentSlot>;
}

export function isInventoryEvent(event: string): event is keyof InventoryPayloads {
    return Object.values(InventoryEvents).some((category) => Object.values(category).includes(event as any));
}

export type EventPayload<T extends keyof InventoryPayloads> = InventoryPayloads[T];

export type InventoryEventHandler<T extends keyof InventoryPayloads> = InventoryPayloads[T] extends void
    ? () => void
    : (...args: InventoryPayloads[T] extends any[] ? InventoryPayloads[T] : [InventoryPayloads[T]]) => void;
