<template>
    <div
        class="flex h-[70vh] flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
        @mousemove="handleContainerMouseMove"
        @mouseleave="handleContainerMouseLeave"
    >
        <h3 class="mb-6 text-xl font-bold tracking-tight">Inventory</h3>
        <div class="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
            <div class="grid grid-cols-4 gap-3 pr-2">
                <template v-for="i in InventoryConfig.itemManager.slots.maxSlots" :key="i">
                    <div
                        :id="`inv-slot-${i - 1}`"
                        class="group relative aspect-square"
                        @mousedown="handleMouseDown($event, i - 1)"
                        @mouseup="handleMouseUp($event, i - 1)"
                        @mouseenter="handleMouseEnter(i - 1)"
                        @mouseleave="handleMouseLeave(i - 1)"
                        @contextmenu.prevent="handleRightClick(i - 1)"
                        :class="{
                            'cursor-grab': getItemAtIndex(i - 1) && !isDragging,
                            'cursor-grabbing': isDragging && dragSourceIndex === i - 1,
                            'drop-target': isDragging && i - 1 !== dragSourceIndex,
                        }"
                    >
                        <!-- Hover Effect -->
                        <div
                            class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                            :class="{
                                'group-hover:opacity-100': !isDragging || i - 1 !== dragSourceIndex,
                                'opacity-100': isDragging && i - 1 !== dragSourceIndex,
                            }"
                        ></div>

                        <!-- Slot Container -->
                        <div
                            class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-2 transition-all duration-300"
                            :class="{
                                'group-hover:border-white/30': !isDragging || i - 1 !== dragSourceIndex,
                                'border-blue-500/50': isDragging && i - 1 !== dragSourceIndex,
                                'opacity-50': isDragging && i - 1 === dragSourceIndex,
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
                                        'group-hover:scale-110': !isDragging || i - 1 !== dragSourceIndex,
                                        'scale-95': isDragging && i - 1 === dragSourceIndex,
                                    }"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">
                                        {{ getItemAtIndex(i - 1)?.name }}
                                    </div>
                                </div>
                                <div
                                    v-if="getItemAtIndex(i - 1)?.quantity > 1"
                                    class="absolute right-2 top-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                                >
                                    {{ getItemAtIndex(i - 1)?.quantity }}x
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
                </template>
            </div>
        </div>

        <!-- Drag Preview -->
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { InventoryConfig } from '../../shared/config';
import { Item } from '@Shared/types/items';

const props = defineProps<{
    inventory: Array<Item | null>;
    toolbarItems: Array<Item | null>;
}>();

const emit = defineEmits<{
    (e: 'select-item', item: Item): void;
    (e: 'swap-items', fromIndex: number, toIndex: number): void;
    (e: 'stack-items', uidToStackOn: string, uidToStack: string): void;
    (e: 'update-positions', newArray: (Item | null)[]): void;
    (e: 'split-item', item: Item): void;
}>();

const isDragging = ref(false);
const draggedItem = ref<Item | null>(null);
const dragSourceIndex = ref<number | null>(null);
const cursorPos = ref({ x: 0, y: 0 });
const mouseDownTimer = ref<number | null>(null);
const mouseDownPos = ref({ x: 0, y: 0 });
const currentHoverIndex = ref<number | null>(null);
const DRAG_DELAY = 200; // ms to hold before dragging

const getItemAtIndex = (index: number): Item | null => {
    return props.inventory[index] || null;
};

const getHotkeyNumber = (item: Item | null): number | null => {
    if (!item) return null;
    const index = props.toolbarItems.findIndex((i) => i?.uid === item.uid);
    return index !== -1 ? index + 1 : null;
};

const handleMouseDown = (event: MouseEvent, index: number) => {
    const item = getItemAtIndex(index);
    if (!item) return;

    mouseDownPos.value = { x: event.clientX, y: event.clientY };

    if (mouseDownTimer.value) {
        clearTimeout(mouseDownTimer.value);
    }

    mouseDownTimer.value = window.setTimeout(() => {
        console.log('[DEBUG] Starting drag for item:', item.name);

        isDragging.value = true;
        draggedItem.value = item;
        dragSourceIndex.value = index;
    }, DRAG_DELAY) as unknown as number;

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
};

const handleMouseUp = (event: MouseEvent, index: number) => {
    if (mouseDownTimer.value) {
        clearTimeout(mouseDownTimer.value);
        mouseDownTimer.value = null;
    }

    const item = getItemAtIndex(index);

    if (!isDragging.value) {
        const dx = event.clientX - mouseDownPos.value.x;
        const dy = event.clientY - mouseDownPos.value.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5 && item) {
            console.log('[DEBUG] Selecting item:', item.name);
            emit('select-item', item);
        }
    } else if (isDragging.value && dragSourceIndex.value !== null) {
        if (currentHoverIndex.value !== null && index !== dragSourceIndex.value) {
            const fromItem = getItemAtIndex(dragSourceIndex.value);
            const toItem = getItemAtIndex(index);

            if (fromItem && toItem && fromItem.id === toItem.id) {
                emit('stack-items', fromItem.uid, toItem.uid);
            } else {
                console.log('[DEBUG] Swapping items:', {
                    from: dragSourceIndex.value,
                    to: index,
                    fromItem: getItemAtIndex(dragSourceIndex.value)?.name,
                    toItem: getItemAtIndex(index)?.name,
                });
                emit('swap-items', dragSourceIndex.value, index);
            }
        }
    }

    isDragging.value = false;
    draggedItem.value = null;
    dragSourceIndex.value = null;
    currentHoverIndex.value = null;

    handleGlobalMouseUp();
};

const handleMouseEnter = (index: number) => {
    currentHoverIndex.value = index;
    if (isDragging.value) {
        console.log('[DEBUG] Hovering over slot:', index);
    }
};

const handleMouseLeave = (index: number) => {
    if (currentHoverIndex.value === index) {
        currentHoverIndex.value = null;
    }
};

const handleRightClick = (index: number) => {
    const item = getItemAtIndex(index);
    if (item) {
        emit('split-item', item);
    }
};

const handleContainerMouseMove = (event: MouseEvent) => {
    if (isDragging.value) {
        cursorPos.value = { x: event.clientX, y: event.clientY };
    }
};

const handleContainerMouseLeave = (event: MouseEvent) => {
    if (isDragging.value) {
        console.log('[DEBUG] Drag cancelled');
        isDragging.value = false;
        draggedItem.value = null;
        dragSourceIndex.value = null;
        currentHoverIndex.value = null;
    }
};

const handleGlobalMouseMove = (event: MouseEvent) => {
    if (mouseDownTimer.value) {
        const dx = event.clientX - mouseDownPos.value.x;
        const dy = event.clientY - mouseDownPos.value.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            clearTimeout(mouseDownTimer.value);
            mouseDownTimer.value = null;
        }
    }

    if (isDragging.value) {
        cursorPos.value = { x: event.clientX, y: event.clientY };
    }
};

const handleGlobalMouseUp = () => {
    if (mouseDownTimer.value) {
        clearTimeout(mouseDownTimer.value);
        mouseDownTimer.value = null;
    }

    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
};

onMounted(() => {
    console.log('[DEBUG] InventoryGrid mounted');
    window.addEventListener('mousemove', handleGlobalMouseMove);
});

onUnmounted(() => {
    if (mouseDownTimer.value) {
        clearTimeout(mouseDownTimer.value);
    }
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
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
