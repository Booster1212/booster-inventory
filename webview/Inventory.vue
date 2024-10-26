<template>
    <div class="min-h-screen w-screen bg-gradient-to-b from-black via-slate-900/90 to-black text-white">
        <!-- Header Section -->
        <HeaderComponent
            :total-weight="totalWeight"
            :toolbar-items="toolbarItems"
            @use-item="handleUseItem"
            @assign-hotkey="handleAssignHotkey"
            @remove-hotkey="handleRemoveHotkey"
        />

        <div class="mx-auto max-w-7xl p-8">
            <div class="grid grid-cols-12 gap-8">
                <!-- Equipment Section -->
                <div class="col-span-3">
                    <EquipmentComponent
                        :equipment-slots="equipmentSlots"
                        @equip-item="handleEquipItem"
                        @unequip-item="handleUnequipItem"
                    />
                </div>

                <!-- Inventory Grid -->
                <div class="col-span-6">
                    <InventoryGridComponent
                        :inventory="inventoryWithNulls"
                        :toolbar-items="toolbarItems"
                        @select-item="handleSelectItem"
                        @swap-items="handleSwapItems"
                        @stack-items="handleStackItems"
                        @update-positions="handleUpdatePositions"
                        @split-item="handleSplitItem"
                    />
                </div>

                <!-- Details Section -->
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

        <!-- Split Modal -->
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
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { useInventory } from './composable/useInventory';
import { useToolbar } from './composable/useToolbar';
import { useEquipment } from './composable/useEquipment';
import { useItemSplit } from './composable/useItemSplit';
import { useWeightManagement } from './composable/useWeightManagement';
import { useItemValidation } from './composable/useItemValidation';
import { Item } from '@Shared/types/items.js';
import { InventoryEvents } from '../shared/events';

import HeaderComponent from './components/Header.vue';
import EquipmentComponent from './components/Equipment.vue';
import InventoryGridComponent from './components/InventoryGrid.vue';
import DetailsSectionComponent from './components/DetailSection.vue';
import SplitModal from './components/SplitModal.vue';

const events = useEvents();

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

const { equipmentSlots, equipItem, unequipItem, hasEquippedItem, canEquipItem } = useEquipment();

const { showSplitModal, selectedItemForSplit, handleSplitItem, openSplitModal, closeSplitModal } = useItemSplit();

const { formattedTotalWeight: totalWeight, canAddItem, getWeightStatus } = useWeightManagement(inventory);

const { isValidItem } = useItemValidation();

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
    assignToHotkey(item, slot);
};

const handleRemoveHotkey = (slot: number) => {
    removeFromHotkey(slot);
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

const setupEventHandlers = () => {
    const handleInventoryUpdate = (itemsFromServer: Array<Item>) => {
        if (!Array.isArray(itemsFromServer)) return;

        updateInventory(itemsFromServer);

        toolbarItems.value = toolbarItems.value.map((toolbarItem) => {
            if (!toolbarItem) return null;
            const updatedItem = itemsFromServer.find((item) => item.uid === toolbarItem.uid);
            return updatedItem && isValidItem(updatedItem) ? updatedItem : null;
        });
    };

    events.on(InventoryEvents.Webview.Inventory_UpdateItems, handleInventoryUpdate);
    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (items: Array<Item | null>) => {
        if (Array.isArray(items)) {
            toolbarItems.value = items.map((item) => (item && isValidItem(item) ? item : null));
        }
    });

    return () => {
        // events.off(InventoryEvents.Webview.Inventory_UpdateItems, handleInventoryUpdate);
    };
};

watch(inventory, () => {
    const status = getWeightStatus();
    if (status.status === 'overweight') {
        // events.emit(InventoryEvents.Webview.Inventory_Error, status.message);
    }
});

onMounted(async () => {
    try {
        loadToolbarFromStorage();
        loadInventoryPositions();
        await loadInventory();
    } catch (error) {
        console.error('Error initializing inventory:', error);
        //events.emit(InventoryEvents.Webview.Inventory_Error, 'Failed to load inventory');
    }
});

const cleanup = setupEventHandlers();
onBeforeUnmount(() => {
    if (typeof cleanup === 'function') {
        cleanup();
    }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 300ms ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

* {
    user-select: none;
}
</style>
