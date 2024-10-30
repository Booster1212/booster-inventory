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
import { onMounted, ref } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { useInventory } from './composable/useInventory';
import { useToolbar } from './composable/useToolbar';
import { useEquipment } from './composable/useEquipment';
import { useItemSplit } from './composable/useItemSplit';
import { useWeightManagement } from './composable/useWeightManagement';
import { useItemValidation } from './composable/useItemValidation';
import { Item } from '@Shared/types/items.js';
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
    handleSwapItems,
    handleStackItems,
    handleUpdatePositions,
    loadInventory,
    loadInventoryPositions,
    updateInventory,
} = useInventory();

const { toolbarItems, assignToHotkey, removeFromHotkey, loadToolbarFromStorage, updateToolbarItem } = useToolbar();
const { equipmentSlots, equipItem, unequipItem, canEquipItem } = useEquipment();
const { showSplitModal, selectedItemForSplit, handleSplitItem, closeSplitModal } = useItemSplit();
const { formattedTotalWeight: totalWeight, getWeightStatus } = useWeightManagement(inventory);
const { isValidItem } = useItemValidation();

const setCurrentDragData = (data: DragData) => {
    console.log('Setting current drag data:', data);
    currentDragData.value = data;
};

const clearCurrentDragData = () => {
    console.log('Clearing current drag data');
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
    useItem(item);
};

const handleDropItem = async (item: Item) => {
    if (!isValidItem(item)) return;
    dropItem(item);
};

const handleAssignHotkey = (item: Item, slot: number) => {
    if (!isValidItem(item)) return;
    console.log('Assigning hotkey:', { item, slot });

    const index = inventoryWithNulls.value.findIndex((i) => i?.uid === item.uid);
    if (index === -1) return;

    const newInventory = [...inventoryWithNulls.value];
    newInventory[index] = null;

    handleUpdatePositions(newInventory);
    assignToHotkey(item, slot);
};

const handleRemoveHotkey = (slot: number) => {
    const item = toolbarItems.value[slot];
    if (!item || !isValidItem(item)) return;

    const emptySlotIndex = inventoryWithNulls.value.findIndex((i) => i === null);
    if (emptySlotIndex === -1) return;

    removeFromHotkey(slot);

    const newInventory = [...inventoryWithNulls.value];
    newInventory[emptySlotIndex] = item;
    handleUpdatePositions(newInventory);
};

const handleEquipItem = (item: Item, slotId: string) => {
    if (!isValidItem(item) || !canEquipItem(item, slotId)) return;
    equipItem(item, slotId);
};

const handleUnequipItem = (slotId: string) => {
    unequipItem(slotId);
};

const handleSplitConfirm = (item: Item, quantity: number) => {
    if (!isValidItem(item)) return;
    handleSplitItem(item, quantity);
};

onMounted(async () => {
    try {
        loadToolbarFromStorage();
        loadInventoryPositions();
        await loadInventory();
    } catch (error) {
        console.error('Error initializing inventory:', error);
    }
});
</script>
