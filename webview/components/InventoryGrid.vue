<template>
    <div
        class="flex h-[70vh] flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
    >
        <h3 class="mb-6 text-xl font-bold tracking-tight">Inventory</h3>
        <div class="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
            <div class="grid grid-cols-4 gap-3 pr-2">
                <template v-for="i in InventoryConfig.itemManager.slots.maxSlots" :key="i">
                    <!-- Empty or Item Slot -->
                    <Draggable
                        @onLeftClick="() => handleItemClick(getItemAtIndex(i - 1))"
                        @onDrag="handleDrag"
                        @onDragStart="() => handleDragStart(i - 1)"
                        @onDragStop="handleDragStop"
                        @onDblClick="() => handleDblClick(getItemAtIndex(i - 1))"
                    >
                        <div
                            :id="`inv-slot-${i - 1}`"
                            class="group relative aspect-square"
                            :class="{ 'cursor-grab active:cursor-grabbing': getItemAtIndex(i - 1) }"
                        >
                            <div
                                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                            ></div>
                            <div
                                class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-2 transition-all duration-300 group-hover:border-white/30"
                                :class="{
                                    'border-blue-500/50': isDragging && !getItemAtIndex(i - 1),
                                    'opacity-50': isDragging && dragSourceIndex === i - 1,
                                }"
                            >
                                <!-- Item Display -->
                                <div
                                    v-if="getItemAtIndex(i - 1)"
                                    class="relative h-full w-full overflow-hidden rounded-lg"
                                >
                                    <img
                                        :src="getItemAtIndex(i - 1).icon"
                                        :alt="getItemAtIndex(i - 1).name"
                                        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        draggable="false"
                                    />
                                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                        <div class="truncate text-xs font-medium text-gray-300">
                                            {{ getItemAtIndex(i - 1).name }}
                                        </div>
                                    </div>
                                    <div
                                        v-if="getItemAtIndex(i - 1).quantity > 1"
                                        class="absolute right-2 top-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                                    >
                                        {{ getItemAtIndex(i - 1).quantity }}x
                                    </div>
                                    <div
                                        v-if="getHotkeyNumber(getItemAtIndex(i - 1))"
                                        class="absolute left-2 top-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-300"
                                    >
                                        {{ getHotkeyNumber(getItemAtIndex(i - 1)) }}
                                    </div>
                                </div>
                                <!-- Empty Slot Display -->
                                <div v-else class="flex h-full w-full items-center justify-center">
                                    <div class="text-xs text-gray-600">{{ i }}</div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { InventoryConfig } from '../../shared/config';
import { Item } from '@Shared/types/items.js';
import Draggable from '../../../../../webview/src/components/Draggable.vue';

// Debug Configuration
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
    if (DEBUG) {
        console.log(`[Inventory] ${message}`, ...args);
    }
};

const props = defineProps<{
    inventory: Array<Item>;
    toolbarItems: Array<Item | null>;
}>();

const emit = defineEmits<{
    (e: 'select-item', item: Item): void;
    (e: 'swap-items', fromIndex: number, toIndex: number): void;
}>();

const isDragging = ref(false);
const dragSourceIndex = ref<number | null>(null);
const dragStartTime = ref<number>(0);

const handleItemClick = (item: Item | null) => {
    if (!item) return;

    const dragDuration = Date.now() - dragStartTime.value;
    debugLog('Click Handler', {
        itemName: item.name,
        isDragging: isDragging.value,
        dragDuration,
    });

    if (dragDuration < 150) {
        debugLog('Emitting select-item', item);
        emit('select-item', item);
    }
};

const handleDblClick = (item: Item | null) => {
    if (!item) return;
    debugLog('Double Click', item.name);
};

const getItemAtIndex = (index: number): Item | null => {
    return props.inventory[index] || null;
};

const getHotkeyNumber = (item: Item): number | null => {
    const index = props.toolbarItems.findIndex((i) => i?.uid === item.uid);
    return index !== -1 ? index + 1 : null;
};

const handleDragStart = (index: number) => {
    const item = getItemAtIndex(index);
    if (!item) {
        debugLog('Drag Start Prevented - No item', { index });
        return;
    }

    debugLog('Drag Start', {
        index,
        itemName: item.name,
    });

    dragStartTime.value = Date.now();
    isDragging.value = true;
    dragSourceIndex.value = index;
};

const handleDragStop = () => {
    debugLog('Drag Stop', {
        sourceIndex: dragSourceIndex.value,
        duration: Date.now() - dragStartTime.value,
    });

    isDragging.value = false;
    dragSourceIndex.value = null;
};

const handleDrag = (fromId: string, toId: string) => {
    debugLog('Drag Event', { fromId, toId });

    if (!fromId.startsWith('inv-slot-') || !toId.startsWith('inv-slot-')) {
        debugLog('Invalid drag IDs', { fromId, toId });
        return;
    }

    const fromIndex = parseInt(fromId.split('-')[2]);
    const toIndex = parseInt(toId.split('-')[2]);

    if (isNaN(fromIndex) || isNaN(toIndex)) {
        debugLog('Invalid index parsing', { fromIndex, toIndex });
        return;
    }

    if (fromIndex === toIndex) {
        debugLog('Same slot drag', { index: fromIndex });
        return;
    }

    const fromItem = getItemAtIndex(fromIndex);
    if (!fromItem) {
        debugLog('No item at source', { fromIndex });
        return;
    }

    debugLog('Emitting swap', {
        fromIndex,
        toIndex,
        fromItem: fromItem.name,
        toItem: getItemAtIndex(toIndex)?.name ?? 'empty',
    });

    emit('swap-items', fromIndex, toIndex);
    handleDragStop();
};
</script>

<style scoped>
.grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
}

.aspect-square {
    aspect-ratio: 1 / 1;
}

/* Custom scrollbar styling */
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
