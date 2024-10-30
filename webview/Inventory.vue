//Inventory.vue
<template>
    <div class="min-h-screen w-screen bg-gradient-to-b from-black via-slate-900/90 to-black text-white">
        <HeaderComponent
            :total-weight="totalWeight"
            :toolbar-items="toolbarItems"
            :current-drag-data="currentDragData"
            @use-item="handleUseItem"
            @assign-hotkey="handleAssignHotkey"
            @remove-hotkey="handleRemoveHotkey"
        />

        <div class="mx-auto max-w-7xl p-8">
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-3">
                    <EquipmentComponent
                        :equipment-slots="equipmentSlots"
                        @equip-item="handleEquipItem"
                        @unequip-item="handleUnequipItem"
                    />
                </div>

                <div class="col-span-6">
                    <InventoryGridComponent
                        :inventory="inventoryWithNulls"
                        :toolbar-items="toolbarItems"
                        :current-drag-data="currentDragData"
                        @select-item="handleSelectItem"
                        @swap-items="handleSwapItems"
                        @stack-items="handleStackItems"
                        @update-positions="handleUpdatePositions"
                        @split-item="handleSplitItem"
                        @assign-hotkey="handleAssignHotkey"
                        @drag-start="setCurrentDragData"
                        @drag-end="clearCurrentDragData"
                    />
                </div>

                <div class="col-span-3">
                    <DetailsSectionComponent
                        :selected-item="selectedItem"
                        :toolbar-items="toolbarItems"
                        @close="handleCloseDetails"
                        @assign-hotkey="handleAssignHotkey"
                        @remove-hotkey="handleRemoveHotkey"
                        @use-item="handleUseItem"
                        @drop-item="handleDropItem"
                    />
                </div>
            </div>
        </div>

        <SplitModal
            v-if="showSplitModal"
            v-model="showSplitModal"
            :item="selectedItemForSplit"
            @update:model-value="closeSplitModal"
            @split="handleSplitConfirm"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { useInventory } from './composable/useInventory';
import { useToolbar } from './composable/useToolbar';
import { useEquipment } from './composable/useEquipment';
import { useItemSplit } from './composable/useItemSplit';
import { useWeightManagement } from './composable/useWeightManagement';
import { useItemValidation } from './composable/useItemValidation';
import { Item } from '@Shared/types/items';
import { InventoryEvents } from '../shared/events';

import HeaderComponent from './components/header/Header.vue';
import EquipmentComponent from './components/Equipment.vue';
import InventoryGridComponent from './components/InventoryGrid.vue';
import DetailsSectionComponent from './components/DetailSection.vue';
import SplitModal from './components/SplitModal.vue';

interface DragData {
    item: Item | null;
    sourceIndex: number | null;
    sourceType: 'inventory' | 'toolbar' | null;
}

const events = useEvents();
const currentDragData = ref<DragData>({
    item: null,
    sourceIndex: null,
    sourceType: null,
});

const {
    inventory,
    inventoryWithNulls,
    selectedItem,
    useItem,
    dropItem,
    handleSwapItems: handleInventorySwap,
    handleStackItems: handleInventoryStack,
    handleUpdatePositions: handleInventoryPositions,
    loadInventory,
    updateInventory,
} = useInventory();

const { toolbarItems, assignToHotkey, removeFromHotkey, loadToolbar } = useToolbar();

const { equipmentSlots, equipItem, unequipItem, canEquipItem, loadEquipment } = useEquipment();

const { showSplitModal, selectedItemForSplit, handleSplitItem, closeSplitModal } = useItemSplit();

const { formattedTotalWeight: totalWeight, getWeightStatus } = useWeightManagement(inventory);

const { isValidItem } = useItemValidation();

const setCurrentDragData = (data: DragData) => {
    currentDragData.value = data;
};

const clearCurrentDragData = () => {
    currentDragData.value = {
        item: null,
        sourceIndex: null,
        sourceType: null,
    };
};

const handleSelectItem = (item: Item) => {
    if (!isValidItem(item)) return;
    selectedItem.value = item;
};

const handleCloseDetails = () => {
    selectedItem.value = null;
};

const handleUseItem = async (item: Item) => {
    if (!isValidItem(item)) return;
    await useItem(item);
};

const handleDropItem = async (item: Item) => {
    if (!isValidItem(item)) return;
    await dropItem(item);
    await events.emitServer(InventoryEvents.Server.Inventory_DropItem, item);
};

const handleAssignHotkey = async (item: Item, slot: number) => {
    if (!isValidItem(item)) return;

    try {
        await assignToHotkey(item, slot);
    } catch (error) {
        console.error('Error assigning hotkey:', error);
    }
};

const handleRemoveHotkey = async (slot: number) => {
    const item = toolbarItems.value[slot];
    if (!item || !isValidItem(item)) return;

    try {
        await removeFromHotkey(slot);
    } catch (error) {
        console.error('Error removing hotkey:', error);
    }
};

const handleEquipItem = async (item: Item, slotId: string) => {
    if (!isValidItem(item) || !canEquipItem(item, slotId)) return;

    try {
        await equipItem(item, slotId);
    } catch (error) {
        console.error('Error equipping item:', error);
    }
};

const handleUnequipItem = async (slotId: string) => {
    try {
        const item = await unequipItem(slotId);
        if (item) {
            const emptySlotIndex = inventoryWithNulls.value.findIndex((i) => i === null);
            if (emptySlotIndex !== -1) {
                const newInventory = [...inventoryWithNulls.value];
                newInventory[emptySlotIndex] = item;
                await handleInventoryPositions(newInventory);
            }
        }
    } catch (error) {
        console.error('Error unequipping item:', error);
    }
};

const handleSwapItems = async (fromIndex: number, toIndex: number) => {
    try {
        await handleInventorySwap(fromIndex, toIndex);
        await events.emitServer(InventoryEvents.Server.Inventory_SwapItems, fromIndex, toIndex);
    } catch (error) {
        console.error('Error swapping items:', error);
    }
};

const handleStackItems = async (uidToStackOn: string, uidToStack: string) => {
    try {
        await handleInventoryStack(uidToStackOn, uidToStack);
        await events.emitServer(InventoryEvents.Server.Inventory_StackItems, uidToStackOn, uidToStack);
    } catch (error) {
        console.error('Error stacking items:', error);
    }
};

const handleUpdatePositions = async (newArray: (Item | null)[]) => {
    try {
        await handleInventoryPositions(newArray);
    } catch (error) {
        console.error('Error updating positions:', error);
    }
};

const handleSplitConfirm = async (item: Item, quantity: number) => {
    if (!isValidItem(item)) return;
    try {
        await handleSplitItem(item, quantity);
        await events.emitServer(InventoryEvents.Server.Inventory_SplitItems, item.uid, quantity);
    } catch (error) {
        console.error('Error splitting item:', error);
    }
};

const initializeInventory = async () => {
    try {
        await Promise.all([loadInventory(), loadToolbar(), loadEquipment()]);
    } catch (error) {
        console.error('Error initializing inventory:', error);
        events.emitServer(InventoryEvents.Webview.Inventory_Error, 'Failed to load inventory');
    }
};

onMounted(async () => {
    await initializeInventory();

    events.on(InventoryEvents.Webview.Inventory_UpdateItems, updateInventory);
    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (items) => {
        toolbarItems.value = items;
    });
});

watch(
    () => toolbarItems.value,
    (newItems) => {
        if (!currentDragData.value.item) {
            events.emitServer(InventoryEvents.Webview.Inventory_UpdateToolbar, newItems);
        }
    },
    { deep: true },
);
</script>
