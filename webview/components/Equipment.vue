//Equipment.vue
<template>
    <div
        class="h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
    >
        <h3 class="mb-4 text-xl font-bold tracking-tight">Equipment</h3>

        <div class="mb-4 flex justify-center">
            <button
                @click="selectedCategory = 'clothing'"
                :class="{ 'bg-blue-500 text-white': selectedCategory === 'clothing' }"
                class="rounded-l-lg border border-white/10 px-4 py-2 transition-all duration-300 hover:bg-blue-500 hover:text-white"
            >
                Clothing
            </button>
            <button
                @click="selectedCategory = 'props'"
                :class="{ 'bg-purple-500 text-white': selectedCategory === 'props' }"
                class="rounded-r-lg border border-white/10 px-4 py-2 transition-all duration-300 hover:bg-purple-500 hover:text-white"
            >
                Props
            </button>
        </div>

        <div class="custom-scrollbar h-[calc(100%-6rem)] overflow-y-auto p-2">
            <div class="grid grid-cols-2 gap-4">
                <div
                    v-for="slot in filteredSlots"
                    :key="slot.id"
                    class="group relative flex h-28 w-full flex-col"
                    @dragover.prevent="handleDragOver($event, slot)"
                    @drop.prevent="handleDrop($event, slot)"
                    @dragenter.prevent
                    @dragleave="handleDragLeave(slot)"
                >
                    <div
                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                        :class="{ 'opacity-100': isSlotHighlighted(slot.id) }"
                    ></div>

                    <div
                        class="relative h-full w-full flex-1 rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent transition-all duration-300"
                        :class="{ 'border-blue-500/50': isSlotHighlighted(slot.id) }"
                    >
                        <template v-if="!slot.item">
                            <div class="flex h-full w-full flex-col items-center justify-center">
                                <div
                                    class="text-3xl opacity-50 transition-all duration-300 group-hover:scale-110 group-hover:opacity-80"
                                >
                                    {{ slot.icon }}
                                </div>
                            </div>
                        </template>

                        <template v-else>
                            <div
                                class="relative h-full w-full overflow-hidden rounded-lg"
                                @contextmenu.prevent="handleUnequipItem(slot)"
                            >
                                <img
                                    :src="slot.item.icon"
                                    :alt="slot.item.name"
                                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">
                                        {{ slot.item.name }}
                                    </div>
                                    <div class="mt-1 text-xs text-gray-500">
                                        {{ slot.name }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="mt-1 text-center text-xs text-gray-600">
                        {{ slot.name }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { EquipmentSlot } from '../../shared/types';
import { useEquipment } from '../composable/useEquipment';
import { useItemValidation } from '../composable/useItemValidation';
import { Item } from '@Shared/types/items';
import { useEvents } from '@Composables/useEvents';
import { InventoryEvents } from '../../shared/events';

interface Props {
    equipmentSlots: EquipmentSlot[];
}

interface Emits {
    (e: 'equip-item', item: Item, slotId: string): void;
    (e: 'unequip-item', slotId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCategory = ref('clothing');
const highlightedSlot = ref<string | null>(null);
const events = useEvents();
const { isValidItem } = useItemValidation();
const { loadEquipment, canEquipItem } = useEquipment();

const filteredSlots = computed(() => {
    return props.equipmentSlots.filter((slot) => {
        if (selectedCategory.value === 'clothing') {
            return [
                'head',
                'masks',
                'hair_styles',
                'torsos',
                'legs',
                'bags',
                'shoes',
                'accessories',
                'undershirts',
                'body_armors',
                'decals',
                'tops',
            ].includes(slot.id);
        } else {
            return ['hats', 'glasses', 'ears', 'watches', 'bracelets'].includes(slot.id);
        }
    });
});

const isSlotHighlighted = (slotId: string): boolean => {
    return highlightedSlot.value === slotId;
};

const handleDragOver = (event: DragEvent, slot: EquipmentSlot) => {
    event.preventDefault();
    const item = JSON.parse(event.dataTransfer?.getData('application/json') || '{}');

    if (isValidItem(item) && canEquipItem(item, slot.id)) {
        highlightedSlot.value = slot.id;
        event.dataTransfer!.dropEffect = 'move';
    } else {
        highlightedSlot.value = null;
        event.dataTransfer!.dropEffect = 'none';
    }
};

const handleDrop = async (event: DragEvent, slot: EquipmentSlot) => {
    event.preventDefault();
    highlightedSlot.value = null;

    const itemData = event.dataTransfer?.getData('application/json');
    if (!itemData) return;

    const item = JSON.parse(itemData);
    if (!isValidItem(item) || !canEquipItem(item, slot.id)) return;

    try {
        await events.emitServer(InventoryEvents.Server.Inventory_EquipItem, item, slot.id);
        emit('equip-item', item, slot.id);
    } catch (error) {
        console.error('Error equipping item:', error);
    }
};

const handleDragLeave = (slot: EquipmentSlot) => {
    if (highlightedSlot.value === slot.id) {
        highlightedSlot.value = null;
    }
};

const handleUnequipItem = async (slot: EquipmentSlot) => {
    if (!slot.item) return;

    try {
        await events.emitServer(InventoryEvents.Server.Inventory_UnequipItem, slot.id);
        emit('unequip-item', slot.id);
    } catch (error) {
        console.error('Error unequipping item:', error);
    }
};

onMounted(async () => {
    await loadEquipment();
});
</script>

<style scoped>
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
</style>
