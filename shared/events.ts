import { Item } from '@Shared/types/items.js';

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
    },
    RPC: {
        Inventory_GetItems: 'inventory:get-items',
        Inventory_GetWeight: 'inventory:get-weight',
    },
    Webview: {
        Inventory_UpdateItems: 'inventory:update-items',
        Inventory_UpdateToolbar: 'inventory:update-toolbar',
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

    [InventoryEvents.Webview.Inventory_UpdateItems]: [items: Array<Item | null>];
    [InventoryEvents.Webview.Inventory_UpdateToolbar]: [items: Array<Item | null>];
    [InventoryEvents.Webview.Inventory_KeyPress]: [keyNumber: number];
    [InventoryEvents.Webview.Inventory_Error]: [message: string];
    [InventoryEvents.Webview.Inventory_Success]: [message: string];

    [InventoryEvents.Client.Inventory_Loaded]: void;
    [InventoryEvents.Client.Inventory_Error]: [error: string];

    [InventoryEvents.RPC.Inventory_GetItems]: Array<Item | null>;
    [InventoryEvents.RPC.Inventory_GetWeight]: number;
}

// Type guard for inventory events
export function isInventoryEvent(event: string): event is keyof InventoryPayloads {
    return Object.values(InventoryEvents).some((category) => Object.values(category).includes(event as any));
}

// Helper type for extracting payload types
export type EventPayload<T extends keyof InventoryPayloads> = InventoryPayloads[T];

// Helper type for event handlers
export type InventoryEventHandler<T extends keyof InventoryPayloads> = InventoryPayloads[T] extends void
    ? () => void
    : (...args: InventoryPayloads[T] extends any[] ? InventoryPayloads[T] : [InventoryPayloads[T]]) => void;
