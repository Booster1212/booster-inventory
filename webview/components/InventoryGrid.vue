<template>
    <div
        class="flex h-[70vh] flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
    >
        <div class="mb-6 flex items-center justify-between">
            <h3 class="text-xl font-bold tracking-tight">Inventory</h3>
            <button
                class="group relative rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:border-white/30 hover:bg-white/10"
                @click="handleSort"
            >
                <div
                    class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                ></div>
                <div class="relative flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                        <path
                            fill-rule="evenodd"
                            d="M3 4.25A2.25 2.25 0 015.25 2h13.5A2.25 2.25 0 0121 4.25v9.5A2.25 2.25 0 0118.75 16H6.75a.75.75 0 00-.75.75v2.25a.75.75 0 001.5 0V18h10.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75H5.25a.75.75 0 00-.75.75v9.5a.75.75 0 00.75.75H6v1.5a.75.75 0 001.5 0V16h11a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75H5.25a.75.75 0 01-.75-.75z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span>Sort</span>
                </div>
            </button>
        </div>

        <div class="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
            <div class="grid grid-cols-4 gap-3 pr-2">
                <div
                    v-for="index in InventoryConfig.itemManager.slots.maxSlots"
                    :key="index"
                    :id="`inv-slot-${index - 1}`"
                    class="group relative aspect-square"
                    :draggable="!!getItemAtIndex(index - 1) && isValidItem(getItemAtIndex(index - 1))"
                    @mousedown="handleMouseDown($event, index - 1)"
                    @mouseup="handleMouseUp($event, index - 1)"
                    @dragstart="handleDragStart($event, index - 1)"
                    @dragend="handleDragEnd"
                    @dragenter.prevent
                    @dragover.prevent="handleDragOver($event, index - 1)"
                    @drop.prevent="handleDrop($event, index - 1)"
                    @contextmenu.prevent="handleRightClick($event, index - 1)"
                    :class="slotClasses(index - 1)"
                >
                    <div
                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                        :class="gradientClasses(index - 1)"
                    ></div>

                    <div
                        class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-2 transition-all duration-300"
                        :class="containerClasses(index - 1)"
                    >
                        <template v-if="getItemAtIndex(index - 1) && isValidItem(getItemAtIndex(index - 1))">
                            <div class="relative h-full w-full overflow-hidden rounded-lg">
                                <img
                                    :src="getItemAtIndex(index - 1).icon"
                                    :alt="getItemAtIndex(index - 1).name"
                                    class="h-full w-full object-cover transition-transform duration-300"
                                    :class="{
                                        'group-hover:scale-110': !isDraggingFromIndex(index - 1, 'inventory'),
                                        'scale-95': isDraggingFromIndex(index - 1, 'inventory'),
                                    }"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">
                                        {{ getItemAtIndex(index - 1).name }}
                                    </div>
                                </div>
                                <div
                                    v-if="getItemAtIndex(index - 1).quantity > 1"
                                    class="absolute right-2 top-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                                >
                                    {{ getItemAtIndex(index - 1).quantity }}x
                                </div>
                                <div
                                    v-if="getHotkeyNumber(getItemAtIndex(index - 1))"
                                    class="absolute left-2 top-2 rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-300"
                                >
                                    {{ getHotkeyNumber(getItemAtIndex(index - 1)) }}
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="flex h-full w-full items-center justify-center">
                                <div class="text-xs text-gray-600">{{ index }}</div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <SplitModal v-model="showSplitModal" :item="selectedItemForSplit" @split="handleSplitItem" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { InventoryConfig } from '../../shared/config';
import { Item } from '@Shared/types/items';
import { useDragAndDrop } from '../composable/useDragAndDrop';
import { useToolbar } from '../composable/useToolbar';
import { useItemValidation } from '../composable/useItemValidation';
import { useInventory } from '../composable/useInventory';
import SplitModal from './SplitModal.vue';
import { useItemSplit } from '../composable/useItemSplit';

interface Props {
    inventory: Array<Item | null>;
    toolbarItems: Array<Item | null>;
    currentDragData: {
        item: Item | null;
        sourceIndex: number | null;
        sourceType: 'inventory' | 'toolbar' | null;
    };
}

interface Emits {
    (e: 'select-item', item: Item): void;
    (e: 'swap-items', fromIndex: number, toIndex: number): void;
    (e: 'stack-items', uidToStackOn: string, uidToStack: string): void;
    (e: 'update-positions', newArray: (Item | null)[]): void;
    (e: 'split-item', item: Item, quantity: number): void;
    (e: 'assign-hotkey', item: Item, slot: number): void;
    (e: 'drag-start', data: { item: Item; sourceIndex: number; sourceType: 'inventory' }): void;
    (e: 'drag-end'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { showSplitModal, selectedItemForSplit, handleSplitItem, openSplitModal } = useItemSplit();
const { isValidItem } = useItemValidation();
const isDraggingOver = ref<number | null>(null);

const {
    isDragging,
    draggedItem,
    handleMouseDown: startDrag,
    handleMouseMove: moveDrag,
    handleMouseUp: endDrag,
    isDraggingFromIndex,
    cleanup,
} = useDragAndDrop();

const { getHotkeyNumber } = useToolbar();
const { canItemsStack } = useItemValidation();
const { updateInventory } = useInventory();

const getItemAtIndex = (index: number): Item | null => props.inventory[index] || null;

const handleMouseDown = (event: MouseEvent, index: number) => {
    const item = getItemAtIndex(index);
    if (!item || !isValidItem(item)) return;

    console.log('Grid MouseDown:', { index, item, type: 'inventory' });
    startDrag(event, index, item, 'inventory');
    emit('drag-start', { item, sourceIndex: index, sourceType: 'inventory' });
};

const handleDragStart = (event: DragEvent, index: number) => {
    if (!event.dataTransfer) return;

    const item = getItemAtIndex(index);
    if (!item || !isValidItem(item)) return;

    event.dataTransfer.effectAllowed = 'move';

    const img = new Image();
    img.src = item.icon;
    event.dataTransfer.setDragImage(img, 36, 36);

    startDrag(event, index, item, 'inventory');
    emit('drag-start', { item, sourceIndex: index, sourceType: 'inventory' });
};

const handleDrop = async (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    isDraggingOver.value = null;

    const { item, sourceIndex, sourceType } = props.currentDragData;
    console.log('Grid handleDrop:', { targetIndex, currentDragData: props.currentDragData });

    if (!item || !isValidItem(item) || sourceIndex === null) return;

    if (sourceType === 'toolbar') {
        emit('assign-hotkey', item, targetIndex);
        return;
    }

    if (sourceType === 'inventory') {
        if (sourceIndex === targetIndex) return;

        const targetItem = getItemAtIndex(targetIndex);
        if (targetItem && canItemsStack(item, targetItem)) {
            emit('stack-items', targetItem.uid, item.uid);
            return;
        }

        emit('swap-items', sourceIndex, targetIndex);
    }
};

const handleMouseUp = async (event: MouseEvent, targetIndex: number) => {
    const { wasClick, sourceIndex, sourceType, item } = endDrag(event, targetIndex, 'inventory');
    console.log('Grid handleMouseUp:', {
        wasClick,
        dragData: props.currentDragData,
        endDragResult: { sourceIndex, sourceType, item },
    });

    if (wasClick) {
        const clickedItem = getItemAtIndex(targetIndex);
        if (clickedItem && isValidItem(clickedItem)) {
            emit('select-item', clickedItem);
            return;
        }
    }

    const { item: currentItem, sourceIndex: currentSourceIndex, sourceType: currentSourceType } = props.currentDragData;
    if (!currentItem || currentSourceIndex === null) return;
    if (currentSourceIndex === targetIndex) return;

    if (currentSourceType === 'toolbar') {
        emit('assign-hotkey', currentItem, targetIndex);
        return;
    }

    const targetItem = getItemAtIndex(targetIndex);
    if (targetItem && canItemsStack(currentItem, targetItem)) {
        emit('stack-items', targetItem.uid, currentItem.uid);
        return;
    }

    emit('swap-items', currentSourceIndex, targetIndex);
};

const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    isDraggingOver.value = index;
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
};

const handleDragEnd = () => {
    console.log('Grid DragEnd');
    isDraggingOver.value = null;
    cleanup();
    emit('drag-end');
};

const handleRightClick = (event: MouseEvent, index: number) => {
    const item = getItemAtIndex(index);
    if (item?.quantity > 1) {
        openSplitModal(item);
    }
};

const handleSort = () => {
    const sortedItems = [...props.inventory]
        .filter((item): item is Item => item !== null)
        .sort((a, b) => {
            if (a.id === b.id) return b.quantity - a.quantity;
            return a.id.toString().localeCompare(b.id.toString());
        });

    const newInventory = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);
    sortedItems.forEach((item, index) => {
        newInventory[index] = item;
    });

    updateInventory(newInventory);
    emit('update-positions', newInventory);
};

const slotClasses = (index: number) => ({
    'cursor-grab': getItemAtIndex(index) && !isDragging.value,
    'cursor-grabbing': isDraggingFromIndex(index, 'inventory'),
    'drop-target': isDragging.value && !isDraggingFromIndex(index, 'inventory'),
});

const gradientClasses = (index: number) => ({
    'group-hover:opacity-100': !isDraggingFromIndex(index, 'inventory'),
});

const containerClasses = (index: number) => ({
    'group-hover:border-white/30': !isDraggingFromIndex(index, 'inventory'),
    'opacity-50': isDraggingFromIndex(index, 'inventory'),
    'border-blue-500/50': isDraggingOver.value === index,
});

onMounted(() => {
    window.addEventListener('mousemove', moveDrag);
});

onUnmounted(() => {
    window.removeEventListener('mousemove', moveDrag);
    cleanup();
});
</script>

<style scoped>
.grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
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
