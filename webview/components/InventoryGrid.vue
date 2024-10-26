<template>
    <div
        class="flex h-[70vh] flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
        @mousemove="handleContainerMouseMove"
        @mouseleave="handleContainerMouseLeave"
    >
        <!-- Header -->
        <h3 class="mb-6 text-xl font-bold tracking-tight">Inventory</h3>

        <!-- Inventory Grid -->
        <div class="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
            <div class="grid grid-cols-4 gap-3 pr-2">
                <template v-for="i in InventoryConfig.itemManager.slots.maxSlots" :key="i">
                    <div
                        :id="`inv-slot-${i - 1}`"
                        class="group relative aspect-square"
                        @mousedown="(e) => handleMouseDown(e, i - 1)"
                        @mouseup="(e) => handleMouseUp(e, i - 1)"
                        @mouseenter="() => handleMouseEnter(i - 1)"
                        @mouseleave="() => handleMouseLeave(i - 1)"
                        @contextmenu.prevent="(e) => handleRightClick(e, i - 1)"
                        :class="{
                            'cursor-grab': getItemAtIndex(i - 1) && !isDragging,
                            'cursor-grabbing': isDraggingFromIndex(i - 1),
                            'drop-target': isDragging && !isDraggingFromIndex(i - 1),
                        }"
                    >
                        <!-- Hover Effect -->
                        <div
                            class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                            :class="{
                                'group-hover:opacity-100': !isDraggingFromIndex(i - 1),
                                'opacity-100': isDragging && !isDraggingFromIndex(i - 1),
                            }"
                        ></div>

                        <!-- Item Container -->
                        <div
                            class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-2 transition-all duration-300"
                            :class="{
                                'group-hover:border-white/30': !isDraggingFromIndex(i - 1),
                                'border-blue-500/50': isDragging && !isDraggingFromIndex(i - 1),
                                'opacity-50': isDraggingFromIndex(i - 1),
                            }"
                        >
                            <!-- Item Display -->
                            <div
                                v-if="getItemAtIndex(i - 1)"
                                class="relative h-full w-full overflow-hidden rounded-lg"
                                :class="{ 'pointer-events-none': isDragging }"
                            >
                                <img
                                    :src="getItemAtIndex(i - 1)?.icon"
                                    :alt="getItemAtIndex(i - 1)?.name"
                                    class="h-full w-full object-cover transition-transform duration-300"
                                    :class="{
                                        'group-hover:scale-110': !isDraggingFromIndex(i - 1),
                                        'scale-95': isDraggingFromIndex(i - 1),
                                    }"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">
                                        {{ getItemAtIndex(i - 1)?.name }}
                                    </div>
                                </div>

                                <!-- Item Quantity -->
                                <div
                                    v-if="showItemQuantity(i - 1)"
                                    class="absolute right-2 top-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                                >
                                    {{ getItemAtIndex(i - 1)?.quantity }}x
                                </div>

                                <!-- Hotkey Number -->
                                <div
                                    v-if="showHotkeyNumber(i - 1)"
                                    class="absolute left-2 top-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-300"
                                >
                                    {{ getHotkeyNumber(getItemAtIndex(i - 1)) }}
                                </div>
                            </div>

                            <!-- Empty Slot -->
                            <div v-else class="flex h-full w-full items-center justify-center">
                                <div class="text-xs text-gray-600">{{ i }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- Dragged Item Preview -->
        <Teleport to="body">
            <div
                v-if="isDragging && draggedItem"
                class="pointer-events-none fixed z-50"
                :style="{
                    position: 'fixed',
                    left: `${cursorPos.x}px`,
                    top: `${cursorPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    transition: 'opacity 0.15s ease-out',
                    opacity: 0.9,
                    width: '72px',
                    height: '72px',
                }"
            >
                <div
                    class="relative h-full w-full overflow-hidden rounded-lg border border-blue-500/50 bg-black/90 shadow-lg backdrop-blur-sm"
                >
                    <img
                        :src="draggedItem.icon"
                        :alt="draggedItem.name"
                        class="h-full w-full object-cover"
                        draggable="false"
                    />
                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                        <div class="truncate text-xs font-medium text-gray-300">
                            {{ draggedItem.name }}
                        </div>
                    </div>
                    <div
                        v-if="draggedItem.quantity > 1"
                        class="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-gray-300"
                    >
                        {{ draggedItem.quantity }}x
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Split Modal -->
        <SplitModal v-model="showSplitModal" :item="selectedItemForSplit" @split="handleSplitItem" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { InventoryConfig } from '../../shared/config';
import { Item } from '@Shared/types/items';
import { useDragAndDrop } from '../composable/useDragAndDrop';
import { useItemSplit } from '../composable/useItemSplit';
import { useToolbar } from '../composable/useToolbar';
import { useItemValidation } from '../composable/useItemValidation';
import SplitModal from './SplitModal.vue';

const props = defineProps<{
    inventory: Array<Item | null>;
    toolbarItems: Array<Item | null>;
}>();

const emit = defineEmits<{
    (e: 'select-item', item: Item): void;
    (e: 'swap-items', fromIndex: number, toIndex: number): void;
    (e: 'stack-items', uidToStackOn: string, uidToStack: string): void;
    (e: 'update-positions', newArray: (Item | null)[]): void;
    (e: 'split-item', item: Item, quantity: number): void;
}>();

const {
    isDragging,
    draggedItem,
    dragSourceIndex,
    cursorPos,
    handleMouseDown: dndHandleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
    cleanupDragState,
    isDraggingFromIndex,
} = useDragAndDrop();

const { showSplitModal, selectedItemForSplit, openSplitModal, closeSplitModal, handleSplitItem } = useItemSplit();

const { getHotkeyNumber } = useToolbar();
const { isValidItem, canItemsStack } = useItemValidation();

const getItemAtIndex = (index: number): Item | null => {
    return props.inventory[index] || null;
};

const showItemQuantity = (index: number): boolean => {
    const item = getItemAtIndex(index);
    return Boolean(item && item.quantity > 1);
};

const showHotkeyNumber = (index: number): boolean => {
    const item = getItemAtIndex(index);
    return Boolean(item && getHotkeyNumber(item));
};

const handleMouseDown = (event: MouseEvent, index: number) => {
    const item = getItemAtIndex(index);
    if (!item || !isValidItem(item)) return;
    dndHandleMouseDown(event, index, item);
};

const handleMouseUp = (event: MouseEvent, index: number) => {
    if (!isDragging.value) {
        const item = getItemAtIndex(index);
        if (item && isValidItem(item)) {
            emit('select-item', item);
        }
    } else if (isDragging.value && dragSourceIndex.value !== null && dragSourceIndex.value !== index) {
        const fromItem = getItemAtIndex(dragSourceIndex.value);
        const toItem = getItemAtIndex(index);

        if (fromItem && toItem && canItemsStack(fromItem, toItem)) {
            emit('stack-items', toItem.uid, fromItem.uid);
        } else {
            emit('swap-items', dragSourceIndex.value, index);
        }
    }

    cleanupDragState();
};

const handleRightClick = (event: MouseEvent, index: number) => {
    const item = getItemAtIndex(index);
    if (item && item.quantity > 1) {
        selectedItemForSplit.value = item;
        showSplitModal.value = true;
    }
};

const handleSplitConfirm = (item: Item, quantity: number) => {
    if (isValidItem(item)) {
        emit('split-item', item, quantity);
    }
};

const handleContainerMouseMove = (event: MouseEvent) => {
    if (isDragging.value) {
        cursorPos.value = { x: event.clientX, y: event.clientY };
    }
};

const handleContainerMouseLeave = () => {
    if (isDragging.value) {
        cleanupDragState();
    }
};

onMounted(() => {
    window.addEventListener('mousemove', handleContainerMouseMove);
});

onUnmounted(() => {
    cleanupDragState();
    window.removeEventListener('mousemove', handleContainerMouseMove);
});
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

.drop-target {
    position: relative;
}

.drop-target::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 0.5rem;
    border: 2px dashed rgba(59, 130, 246, 0.5);
    pointer-events: none;
}

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
