//QuickAccess.vue
<template>
    <div class="flex items-center gap-2">
        <div class="text-xs text-gray-500">Quick Access</div>
        <div class="toolbar-container flex items-end justify-center space-x-2">
            <div
                v-for="(item, index) in toolbarItems"
                :key="index"
                class="group relative"
                :draggable="isItemDraggable(item)"
                @mousedown="handleMouseDown($event, index)"
                @mouseup="handleMouseUp($event, index)"
                @drop.prevent="handleDrop($event, index)"
                @dragstart="handleDragStart($event, index)"
                @dragend="handleDragEnd"
                @dragenter.prevent
                @dragover.prevent="handleDragOver($event, index)"
                @contextmenu.prevent="handleRemoveHotkey(index)"
            >
                <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">{{ index + 1 }}</div>
                <div class="relative overflow-hidden">
                    <div
                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                        :class="dropTargetClasses(index)"
                    ></div>

                    <div
                        class="relative h-[72px] w-[72px] rounded-lg border transition-all duration-300"
                        :class="containerClasses(index)"
                    >
                        <template v-if="!item">
                            <div class="flex h-full w-full items-center justify-center"></div>
                        </template>
                        <template v-else>
                            <div class="relative h-full w-full p-1">
                                <img
                                    :src="item.icon"
                                    :alt="item.name"
                                    class="h-full w-full rounded-lg object-cover transition-transform duration-300"
                                    :class="imageClasses(index)"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">{{ item.name }}</div>
                                </div>
                                <div
                                    v-if="item.quantity > 1"
                                    class="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-gray-300"
                                >
                                    {{ item.quantity }}x
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Item } from '@Shared/types/items';
import { useDragAndDrop, DragSource } from '../../composable/useDragAndDrop';
import { useItemValidation } from '../../composable/useItemValidation';
import { useEvents } from '@Composables/useEvents';
import { InventoryEvents } from '../../../shared/events';

interface DragData {
    item: Item | null;
    sourceIndex: number | null;
    sourceType: DragSource | null;
}

interface Props {
    toolbarItems: Array<Item | null>;
    currentDragData: DragData;
}

interface Emits {
    (e: 'remove-hotkey', index: number): void;
    (e: 'assign-hotkey', item: Item, slot: number): void;
    (e: 'swap-items', fromIndex: number, toIndex: number): void;
    (e: 'drag-start', data: DragData): void;
    (e: 'drag-end'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const events = useEvents();

const { isValidItem } = useItemValidation();
const isDraggingOver = ref<number | null>(null);

const {
    isDragging,
    handleMouseDown: startDrag,
    handleMouseUp: endDrag,
    isDraggingFromIndex,
    cleanup,
} = useDragAndDrop();

const isItemDraggable = (item: Item | null) => !!item?.useEventName;

const handleMouseDown = (event: MouseEvent, index: number) => {
    const item = props.toolbarItems[index];
    if (!item || !isValidItem(item) || !isItemDraggable(item)) return;

    startDrag(event, index, item, 'toolbar');
    emit('drag-start', { item, sourceIndex: index, sourceType: 'toolbar' });
};

const handleDragStart = (event: DragEvent, index: number) => {
    if (!event.dataTransfer) return;
    const item = props.toolbarItems[index];
    if (!item || !isValidItem(item) || !isItemDraggable(item)) return;

    const img = new Image();
    img.src = item.icon;
    event.dataTransfer.setDragImage(img, 36, 36);
    event.dataTransfer.effectAllowed = 'move';

    startDrag(event, index, item, 'toolbar');
    emit('drag-start', { item, sourceIndex: index, sourceType: 'toolbar' });
};

const handleDrop = async (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    isDraggingOver.value = null;

    const { item: dragItem, sourceIndex, sourceType } = props.currentDragData;
    if (!dragItem || !isValidItem(dragItem) || !isItemDraggable(dragItem)) return;

    try {
        if (sourceType === 'inventory') {
            events.emitServer(InventoryEvents.Server.Inventory_AssignToToolbar, dragItem, targetIndex);
            emit('assign-hotkey', dragItem, targetIndex);
        } else if (sourceType === 'toolbar' && sourceIndex !== null && sourceIndex !== targetIndex) {
            events.emitServer(InventoryEvents.Server.Inventory_SwapToolbarItems, sourceIndex, targetIndex);
            emit('swap-items', sourceIndex, targetIndex);
        }
    } catch (error) {
        console.error('Error handling drop:', error);
    }
};

const handleMouseUp = async (event: MouseEvent, targetIndex: number) => {
    const { wasClick, item } = endDrag(event, targetIndex, 'toolbar');
    isDraggingOver.value = null;

    if (wasClick && item && isValidItem(item)) {
        events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
        return;
    }

    const { item: dragItem, sourceIndex, sourceType } = props.currentDragData;
    if (!dragItem || !isValidItem(dragItem) || !isItemDraggable(dragItem)) return;

    try {
        if (sourceType === 'inventory') {
            events.emitServer(InventoryEvents.Server.Inventory_AssignToToolbar, dragItem, targetIndex);
            emit('assign-hotkey', dragItem, targetIndex);
        } else if (sourceType === 'toolbar' && sourceIndex !== null && sourceIndex !== targetIndex) {
            events.emitServer(InventoryEvents.Server.Inventory_SwapToolbarItems, sourceIndex, targetIndex);
            emit('swap-items', sourceIndex, targetIndex);
        }
    } catch (error) {
        console.error('Error handling mouse up:', error);
    }
};

const handleRemoveHotkey = async (index: number) => {
    const item = props.toolbarItems[index];
    if (!item || !isValidItem(item)) return;

    try {
        events.emitServer(InventoryEvents.Server.Inventory_RemoveFromToolbar, index);
        emit('remove-hotkey', index);
    } catch (error) {
        console.error('Error removing hotkey:', error);
    }
};

const dropTargetClasses = (index: number) => ({
    'opacity-100 scale-105': isDraggingOver.value === index,
    'group-hover:opacity-100': !isDraggingFromIndex(index, 'toolbar') && props.toolbarItems[index],
});

const containerClasses = (index: number) => ({
    'border-white/5 bg-black/20': !isDragging.value,
    'border-blue-500/50 bg-black/30 scale-95': isDraggingFromIndex(index, 'toolbar') && props.toolbarItems[index],
    'group-hover:border-white/20': !props.toolbarItems[index],
    'border-blue-500/50 shadow-lg bg-blue-500/10': isDraggingOver.value === index,
});

const imageClasses = (index: number) => ({
    'group-hover:scale-110': !isDraggingFromIndex(index, 'toolbar'),
    'scale-100': isDraggingOver.value === index,
    'scale-95 brightness-75': isDraggingFromIndex(index, 'toolbar'),
});

const handleDragEnd = () => {
    if (isDragging.value) {
        isDraggingOver.value = null;
        cleanup();
        emit('drag-end');
    }
};

const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    const { item: dragItem } = props.currentDragData;

    if (dragItem && isValidItem(dragItem) && isItemDraggable(dragItem)) {
        if (isDraggingOver.value !== index) {
            isDraggingOver.value = index;
        }
    } else if (isDraggingOver.value !== null) {
        isDraggingOver.value = null;
    }
};
</script>

<style scoped>
.toolbar-container {
    position: relative;
    z-index: 50;
}

.toolbar-container * {
    transition-property: transform, opacity, border-color, background-color, box-shadow;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-container img {
    transition-duration: 200ms;
    will-change: transform;
}
</style>
