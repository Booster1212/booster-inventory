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
                        @split-item="splitItem"
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
import { ref, computed, onMounted, watch } from 'vue';
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

// State
const inventory = ref<Item[]>([]);
const itemPositions = ref<Record<string, number>>({});
const selectedItem = ref<Item | null>(null);
const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);

// Equipment slots configuration
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

// Computed
const inventoryWithNulls = computed(() => {
    const result = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
    inventory.value.forEach((item) => {
        if (isValidItem(item)) {
            const position = itemPositions.value[item.uid] ?? inventory.value.indexOf(item);
            if (position !== -1 && position < result.length) {
                result[position] = item;
            }
        }
    });
    return result;
});

const totalWeight = computed(() => {
    return inventory.value
        .reduce((acc, item) => {
            if (isValidItem(item)) {
                return acc + item.weight * item.quantity;
            }
            return acc;
        }, 0)
        .toFixed(1);
});

// Type Guards
const isValidItem = (item: unknown): item is Item => {
    if (!item || typeof item !== 'object') return false;
    return ['uid', 'id', 'name', 'weight', 'quantity', 'maxStack', 'icon'].every((prop) => prop in (item as object));
};

// Storage Management
const saveInventoryPositions = () => {
    console.log('[DEBUG] Saving inventory positions');
    const positions: Record<string, number> = {};
    inventoryWithNulls.value.forEach((item, index) => {
        if (isValidItem(item)) {
            positions[item.uid] = index;
        }
    });
    localStorage.setItem(INVENTORY_POSITIONS_KEY, JSON.stringify(positions));
};

const loadInventoryPositions = () => {
    console.log('[DEBUG] Loading inventory positions');
    const stored = localStorage.getItem(INVENTORY_POSITIONS_KEY);
    if (stored) {
        itemPositions.value = JSON.parse(stored);
    }
};

// Toolbar Management
const saveToolbarToStorage = () => {
    console.log('[DEBUG] Saving toolbar to storage');
    localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(toolbarItems.value));
};

const loadToolbarFromStorage = () => {
    console.log('[DEBUG] Loading toolbar from storage');
    const stored = localStorage.getItem(TOOLBAR_STORAGE_KEY);
    if (stored) {
        toolbarItems.value = JSON.parse(stored);
    }
};

const assignToHotkey = (item: Item, slot: number) => {
    console.log('[DEBUG] Assigning item to hotkey:', { item: item.name, slot });
    const existingSlot = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
    if (existingSlot !== -1) {
        toolbarItems.value[existingSlot] = null;
    }
    toolbarItems.value[slot] = item;
    saveToolbarToStorage();
};

const removeFromHotkey = (slot: number) => {
    console.log('[DEBUG] Removing item from hotkey:', slot);
    toolbarItems.value[slot] = null;
    saveToolbarToStorage();
};

// Item Actions
const selectItem = (item: Item) => {
    if (isValidItem(item)) {
        selectedItem.value = item;
        console.log('[DEBUG] Selected item:', item.name);
    }
};

const useItem = (item: Item) => {
    if (isValidItem(item)) {
        console.log('[DEBUG] Using item:', item.name);
        events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
    }
};

const dropItem = (item: Item) => {
    console.log('[DEBUG] Dropping item:', item.name);
    // Implement drop logic here
};

const handleSwapItems = (fromIndex: number, toIndex: number) => {
    console.log('[DEBUG] Swapping items:', { from: fromIndex, to: toIndex });
    if (fromIndex === toIndex) return;

    const fromItem = inventoryWithNulls.value[fromIndex];
    const toItem = inventoryWithNulls.value[toIndex];

    if (fromItem && toItem && fromItem.id === toItem.id) {
        events.emitServer(InventoryEvents.Server.Inventory_StackItems, fromItem.uid, toItem.uid);
    } else {
        const newArray = [...inventoryWithNulls.value];
        [newArray[fromIndex], newArray[toIndex]] = [newArray[toIndex], newArray[fromIndex]];

        inventory.value = newArray.filter(isValidItem);
        handleUpdatePositions(newArray);
    }
};

const handleStackItems = (uidToStackOn: string, uidToStack: string) => {
    console.log('[DEBUG] Stacking items:', { uidToStackOn, uidToStack });
    events.emitServer(InventoryEvents.Server.Inventory_StackItems, uidToStackOn, uidToStack);
};

const handleUpdatePositions = (newArray: (Item | null)[]) => {
    console.log('[DEBUG] Updating item positions');
    itemPositions.value = {};
    newArray.forEach((item, index) => {
        if (isValidItem(item)) {
            itemPositions.value[item.uid] = index;
        }
    });
    saveInventoryPositions();
};

const splitItem = (item: Item) => {
    console.log('[DEBUG] Splitting item:', item.name);
    events.emitServer(InventoryEvents.Server.Inventory_SplitItems, item.uid, 1);
};

// Watchers
watch(
    toolbarItems,
    () => {
        console.log('[DEBUG] Toolbar items changed, saving...');
        saveToolbarToStorage();
    },
    { deep: true },
);

watch(
    inventory,
    (newInventory) => {
        console.log('[DEBUG] Inventory changed, updating toolbar items...');
        toolbarItems.value = toolbarItems.value.map((toolbarItem) => {
            if (!toolbarItem) return null;
            const matchingItem = newInventory.find((item) => isValidItem(item) && item.uid === toolbarItem.uid);
            return matchingItem || null;
        });
    },
    { deep: true },
);

// Lifecycle
onMounted(async () => {
    console.log('[DEBUG] Inventory component mounted');

    loadToolbarFromStorage();
    loadInventoryPositions();

    try {
        const result = await events.emitServerRpc(InventoryEvents.Server.Inventory_RequestItems);
        console.log('[DEBUG] Received inventory items from server:', result);

        if (Array.isArray(result)) {
            inventory.value = result;

            // Update itemPositions based on the received items
            itemPositions.value = {};
            result.forEach((item, index) => {
                if (isValidItem(item)) {
                    itemPositions.value[item.uid] = index;
                }
            });

            toolbarItems.value = toolbarItems.value.map((toolbarItem) =>
                toolbarItem ? { ...(inventory.value.find((item) => item?.uid === toolbarItem.uid) || null) } : null,
            );

            saveToolbarToStorage();
        }
    } catch (error) {
        console.error('[DEBUG] Error loading inventory:', error);
    }

    events.on(InventoryEvents.Webview.Inventory_UpdateItems, (itemsFromServer: Array<Item>) => {
        console.log('[DEBUG] Received inventory update from server');
        if (Array.isArray(itemsFromServer)) {
            inventory.value = itemsFromServer;
        }
    });
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
