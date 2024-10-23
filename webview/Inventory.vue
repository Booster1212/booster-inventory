<template>
    <div class="min-h-screen w-screen bg-gradient-to-b from-black via-slate-900/90 to-black text-white">
        <HeaderComponent
            :totalWeight="totalWeight"
            :toolbarItems="toolbarItems"
            @assign-hotkey="assignToHotkey"
            @remove-hotkey="removeFromHotkey"
        />

        <div class="mx-auto max-w-7xl p-8">
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-3">
                    <EquipmentComponent :equipmentSlots="equipmentSlots" />
                </div>

                <div class="col-span-6">
                    <InventoryGridComponent
                        :inventory="inventory"
                        :toolbarItems="toolbarItems"
                        @select-item="selectItem"
                    />
                </div>

                <div class="col-span-3">
                    <DetailsSectionComponent
                        :selectedItem="selectedItem"
                        :toolbarItems="toolbarItems"
                        @close="selectedItem = null"
                        @assign-hotkey="assignToHotkey"
                        @use-item="useItem"
                        @drop-item="dropItem"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { InventoryEvents } from '../shared/events';
import { Item } from '@Shared/types/items.js';
import HeaderComponent from './components/Header.vue';
import EquipmentComponent from './components/Equipment.vue';
import InventoryGridComponent from './components/InventoryGrid.vue';
import DetailsSectionComponent from './components/DetailSection.vue';

interface EquipmentSlot {
    id: string;
    name: string;
    icon: string;
    item: Item | null;
}

const events = useEvents();

const inventory = ref<Item[]>([
    {
        uid: 'weapon-1',
        id: 'weapon_pistol',
        name: 'Combat Pistol',
        desc: 'Standard issue sidearm with reliable performance',
        maxStack: 1,
        weight: 2.5,
        quantity: 1,
        icon: '../images/crate.jpg',
        data: {
            condition: 98,
            ammo: '12/12',
        },
    },
    {
        uid: 'medical-1',
        // @ts-ignore
        id: 'medical_firstaid',
        name: 'First Aid Kit',
        desc: 'Basic medical supplies for emergency treatment',
        maxStack: 5,
        weight: 0.5,
        quantity: 3,
        icon: '../images/crate.jpg',
        data: {
            healing: 50,
            uses: 3,
        },
    },
]);

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

const selectedItem = ref<Item | null>(null);
const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);

// Computed
const totalWeight = computed(() => {
    return inventory.value.reduce((acc, item) => acc + item.weight * item.quantity, 0).toFixed(1);
});

// Methods
const selectItem = (item: Item) => {
    selectedItem.value = item;
};

const useItem = async (item: Item) => {
    events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
};

const dropItem = async (item: Item) => {
    // TODO: Implement item dropping logic
    console.log('Dropping item:', item);
};

const assignToHotkey = (item: Item, slot: number) => {
    if (!item) return;

    const existingSlot = toolbarItems.value.findIndex((i) => i?.uid === item.uid);
    if (existingSlot !== -1) {
        toolbarItems.value[existingSlot] = null;
    }

    toolbarItems.value[slot] = item;
};

const removeFromHotkey = (slot: number) => {
    toolbarItems.value[slot] = null;
};

// Lifecycle Hooks
onMounted(async () => {
    const result = await events.emitServerRpc(InventoryEvents.Server.Inventory_RequestItems);
    inventory.value = result;

    events.on(InventoryEvents.Webview.Inventory_UpdateItems, (itemsFromServer: Array<Item>) => {
        inventory.value = itemsFromServer;
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

/* Custom scrollbar */
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
