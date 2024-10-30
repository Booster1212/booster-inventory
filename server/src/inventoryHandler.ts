import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useWebview } from '@Server/player/webview.js';
import { Item } from '@Shared/types/items.js';
import { InventoryEvents } from '../../shared/events.js';
import { EquipmentSlot, DEFAULT_EQUIPMENT_SLOTS } from '../../shared/types.js';
import { inventoryService } from './services/InventoryService.js';
import { toolbarService } from './services/ToolbarService.js';
import { equipmentService } from './services/EquipmentService.js';

const Rebar = useRebar();

declare module '@Shared/types/Character.js' {
    export interface Character {
        equipment?: Array<EquipmentSlot>;
        lastWeapon?: {
            hash: number;
            ammo: number;
            tintIndex: number;
            components: any[];
        };
    }
}

export async function updateInventoryWebview(player: alt.Player): Promise<void> {
    try {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const Webview = useWebview(player);

        const inventoryWithEmptySlots = inventoryService.createInventoryWithEmptySlots(rebarDocument.items || []);
        Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);

        const toolbar = rebarDocument.toolbar || new Array(5).fill(null);
        Webview.emit(InventoryEvents.Webview.Inventory_UpdateToolbar, toolbar);

        const equipment = rebarDocument.equipment || DEFAULT_EQUIPMENT_SLOTS;
        Webview.emit(InventoryEvents.Webview.Inventory_UpdateEquipment, equipment);
    } catch (error) {
        console.error('Error updating inventory webview:', error);
    }
}

alt.onClient(InventoryEvents.Server.Inventory_RemoveFromToolbar, async (player: alt.Player, slotIndex: number) => {
    await toolbarService.handleRemoveFromToolbar(player, slotIndex);
});

alt.onClient(
    InventoryEvents.Server.Inventory_StackItems,
    async (player: alt.Player, uidToStackOn: string, uidToStack: string) => {
        const result = await inventoryService.handleStackItems(player, uidToStackOn, uidToStack);
        if (!result.success) {
            console.error('Failed to stack items:', result.error);
        }
    },
);

alt.onClient(InventoryEvents.Server.Inventory_SplitItems, async (player: alt.Player, uid: string, quantity: number) => {
    const result = await inventoryService.handleSplitItems(player, uid, quantity);
    if (!result.success) {
        console.error('Failed to split items:', result.error);
    }
});

alt.onClient(InventoryEvents.Server.Inventory_AssignToToolbar, async (player: alt.Player, item: Item, slot: number) => {
    await toolbarService.handleAssignToToolbar(player, item, slot);
});

alt.onClient(InventoryEvents.Server.Inventory_EquipItem, async (player: alt.Player, item: Item, slotId: string) => {
    const result = await equipmentService.handleEquipItem(player, item, slotId);
    if (!result.success) {
        console.error('Failed to equip item:', result.error);
    }
});

alt.onClient(InventoryEvents.Server.Inventory_UnequipItem, async (player: alt.Player, slotId: string) => {
    const result = await equipmentService.handleUnequipItem(player, slotId);
    if (!result.success) {
        console.error('Failed to unequip item:', result.error);
    }
});

alt.onClient(
    InventoryEvents.Server.Inventory_SwapItems,
    async (player: alt.Player, fromIndex: number, toIndex: number) => {
        const result = await inventoryService.handleSwapItems(player, fromIndex, toIndex);
        if (!result.success) {
            console.error('Failed to swap items:', result.error);
        }
    },
);

alt.onClient(
    InventoryEvents.Server.Inventory_SwapToolbarItems,
    async (player: alt.Player, fromSlot: number, toSlot: number) => {
        const result = await toolbarService.handleSwapToolbarItems(player, fromSlot, toSlot);
        if (!result.success) {
            console.error('Failed to swap toolbar items:', result.error);
        }
    },
);

alt.onRpc(InventoryEvents.Server.Inventory_RequestItems, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.items || [];
});

alt.onRpc(InventoryEvents.RPC.Inventory_GetToolbar, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.toolbar || new Array(5).fill(null);
});

alt.onRpc(InventoryEvents.RPC.Inventory_GetEquipment, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.equipment || DEFAULT_EQUIPMENT_SLOTS;
});

alt.on('rebar:playerCharacterBound', async (player: alt.Player) => {
    await Promise.all([
        toolbarService.initializePlayerToolbar(player),
        equipmentService.initializePlayerEquipment(player),
    ]);

    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    const Webview = useWebview(player);

    Webview.emit(InventoryEvents.Webview.Inventory_UpdateToolbar, rebarDocument.toolbar || new Array(5).fill(null));
    Webview.emit(InventoryEvents.Webview.Inventory_UpdateEquipment, rebarDocument.equipment || DEFAULT_EQUIPMENT_SLOTS);
});
