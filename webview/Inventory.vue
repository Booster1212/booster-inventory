<template>
    <div class="min-h-screen w-screen bg-gradient-to-b from-black via-slate-900/90 to-black text-white">
        <HeaderComponent :totalWeight="totalWeight" :toolbarItems="toolbarItems" @use-item="useItem" />

        <div class="mx-auto max-w-7xl p-8">
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-3">
                    <EquipmentComponent :equipmentSlots="equipmentSlots" />
                </div>

                <div class="col-span-6">
                    <InventoryGridComponent
                        :inventory="inventoryWithNulls"
                        @select-item="selectItem"
                        @swap-items="handleSwapItems"
                        @stack-items="handleStackItems"
                        @update-positions="handleUpdatePositions"
                        @split-item="handleSplitItem"
                        :toolbar-items="toolbarItems"
                    />
                </div>

                <div class="col-span-3">
                    <DetailsSectionComponent
                        :selectedItem="selectedItem"
                        :toolbarItems="toolbarItems"
                        @close="selectedItem = null"
                        @assign-hotkey="assignToHotkey"
                        @remove-hotkey="removeFromHotkey"
                        @use-item="useItem"
                        @drop-item="dropItem"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { InventoryEvents } from '../shared/events';
import { Item } from '@Shared/types/items.js';
import { EquipmentSlot } from '../shared/types';
import { InventoryConfig } from '../shared/config';
import HeaderComponent from './components/Header.vue';
import EquipmentComponent from './components/Equipment.vue';
import InventoryGridComponent from './components/InventoryGrid.vue';
import DetailsSectionComponent from './components/DetailSection.vue';

const events = useEvents();
const TOOLBAR_STORAGE_KEY = 'inventory:toolbar';
const INVENTORY_POSITIONS_KEY = 'inventory:positions';

const inventory = ref<Item[]>([]);
const itemPositions = ref<Record<string, number>>({});
const selectedItem = ref<Item | null>(null);
const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);

const equipmentSlots = ref<EquipmentSlot[]>([
    { id: 'head', name: 'Headwear', icon: '🎩', item: null },
    { id: 'face', name: 'Face', icon: '🕶️', item: null },
    { id: 'torso', name: 'Torso', icon: '👕', item: null },
    { id: 'body_armor', name: 'Body Armor', icon: '🛡️', item: null },
    { id: 'hands', name: 'Hands', icon: '🧤', item: null },
    { id: 'legs', name: 'Legs', icon: '👖', item: null },
    { id: 'feet', name: 'Feet', icon: '👞', item: null },
    { id: 'accessory', name: 'Accessory', icon: '⌚', item: null },
]);

const findFirstAvailableSlot = (slots: Array<Item | null>): number => {
    return slots.findIndex((slot) => slot === null);
};

const fixItemPositions = (slots: Array<Item | null>) => {
    const newPositions: Record<string, number> = {};
    const seenItems = new Set<string>();

    slots.forEach((item, index) => {
        if (!item || seenItems.has(item.uid)) return;
        newPositions[item.uid] = index;
        seenItems.add(item.uid);
    });

    return newPositions;
};

const inventoryWithNulls = computed(() => {
    const result = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
    const usedPositions = new Set<number>();

    inventory.value.forEach((item) => {
        if (!isValidItem(item)) return;

        let position = itemPositions.value[item.uid];

        if (position === undefined || position >= result.length || usedPositions.has(position)) {
            position = findFirstAvailableSlot(result);
        }

        if (position !== -1 && !usedPositions.has(position)) {
            result[position] = item;
            usedPositions.add(position);
            itemPositions.value[item.uid] = position;
        }
    });

    itemPositions.value = fixItemPositions(result);
    return result;
});

const totalWeight = computed(() => {
    return inventory.value.reduce((acc, item) => acc + item.weight * item.quantity, 0).toFixed(1);
});

const isValidItem = (item: unknown): item is Item => {
    if (!item || typeof item !== 'object') return false;
    return ['uid', 'id', 'name', 'weight', 'quantity', 'maxStack', 'icon'].every((prop) => prop in (item as object));
};

const saveInventoryPositions = () => {
    localStorage.setItem(INVENTORY_POSITIONS_KEY, JSON.stringify(itemPositions.value));
};

const loadInventoryPositions = () => {
    try {
        const stored = localStorage.getItem(INVENTORY_POSITIONS_KEY);
        if (stored) {
            itemPositions.value = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading inventory positions:', error);
        itemPositions.value = {};
    }
};

const saveToolbarToStorage = () => {
    localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(toolbarItems.value));
};

const loadToolbarFromStorage = () => {
    try {
        const stored = localStorage.getItem(TOOLBAR_STORAGE_KEY);
        if (stored) {
            toolbarItems.value = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading toolbar:', error);
        toolbarItems.value = [null, null, null, null, null];
    }
};

const assignToHotkey = (item: Item, slot: number) => {
    if (!isValidItem(item)) return;

    const existingSlot = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
    if (existingSlot !== -1) {
        toolbarItems.value[existingSlot] = null;
    }
    toolbarItems.value[slot] = item;
    saveToolbarToStorage();
};

const removeFromHotkey = (slot: number) => {
    toolbarItems.value[slot] = null;
    saveToolbarToStorage();
};

const selectItem = (item: Item) => {
    if (!isValidItem(item)) return;
    selectedItem.value = item;
};

const useItem = (item: Item) => {
    if (!isValidItem(item)) return;
    events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
};

const dropItem = (item: Item) => {
    // Implement drop logic here
};

const handleSwapItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const fromItem = inventoryWithNulls.value[fromIndex];
    const toItem = inventoryWithNulls.value[toIndex];

    if (fromItem && toItem && fromItem.id === toItem.id && fromItem.uid !== toItem.uid) {
        handleStackItems(toItem.uid, fromItem.uid);
        return;
    }

    const newPositions = { ...itemPositions.value };

    if (fromItem) newPositions[fromItem.uid] = toIndex;
    if (toItem) newPositions[toItem.uid] = fromIndex;

    itemPositions.value = newPositions;
    saveInventoryPositions();
};

const handleStackItems = (uidToStackOn: string, uidToStack: string) => {
    if (uidToStackOn === uidToStack) return;
    events.emitServer(InventoryEvents.Server.Inventory_StackItems, uidToStackOn, uidToStack);
};

const handleUpdatePositions = (newArray: (Item | null)[]) => {
    itemPositions.value = fixItemPositions(newArray);
    saveInventoryPositions();
};

const handleSplitItem = (item: Item, quantity: number) => {
    if (!isValidItem(item) || quantity >= item.quantity || quantity <= 0) return;
    events.emitServer(InventoryEvents.Server.Inventory_SplitItems, item.uid, quantity);
};

const setupEventHandlers = () => {
    const handleInventoryUpdate = (itemsFromServer: Array<Item>) => {
        if (!Array.isArray(itemsFromServer)) return;

        inventory.value = itemsFromServer;

        toolbarItems.value = toolbarItems.value.map((toolbarItem) => {
            if (!toolbarItem) return null;
            return itemsFromServer.find((item) => item.uid === toolbarItem.uid) || null;
        });

        itemPositions.value = fixItemPositions(inventoryWithNulls.value);
        saveInventoryPositions();
    };

    events.on(InventoryEvents.Webview.Inventory_UpdateItems, handleInventoryUpdate);
};

onMounted(async () => {
    loadToolbarFromStorage();
    loadInventoryPositions();

    try {
        const result = await events.emitServerRpc(InventoryEvents.Server.Inventory_RequestItems);
        if (Array.isArray(result)) {
            inventory.value = result;

            result.forEach((item, index) => {
                if (isValidItem(item) && !(item.uid in itemPositions.value)) {
                    itemPositions.value[item.uid] = index;
                }
            });

            toolbarItems.value = toolbarItems.value.map((toolbarItem) =>
                toolbarItem ? inventory.value.find((item) => item?.uid === toolbarItem.uid) || null : null,
            );

            itemPositions.value = fixItemPositions(inventoryWithNulls.value);
            saveInventoryPositions();
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
});

const cleanup = setupEventHandlers();
onBeforeUnmount(cleanup);
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
