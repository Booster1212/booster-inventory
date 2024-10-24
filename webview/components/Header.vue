<template>
    <div class="relative border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm">
        <div class="relative mx-auto max-w-7xl p-6">
            <div class="mb-6 flex items-center justify-between">
                <h1 class="text-3xl font-bold tracking-tight text-white">Inventory</h1>

                <div class="group relative">
                    <div
                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                    ></div>
                    <div
                        class="relative rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent px-4 py-2 backdrop-blur-sm transition-all duration-300 group-hover:border-white/30"
                    >
                        <div class="flex items-center gap-2">
                            <div>
                                <div class="mb-1 text-xs text-gray-500">Total Weight</div>
                                <div class="flex items-baseline gap-1 text-sm font-medium">
                                    <span class="text-white">{{ totalWeight }}</span>
                                    <span class="text-gray-600">/</span>
                                    <span class="text-gray-500">{{
                                        InventoryConfig.itemManager.weight.maxWeight.toFixed(1)
                                    }}</span>
                                </div>
                            </div>
                            <div class="h-8 w-24 overflow-hidden rounded-md border border-white/5 bg-white/5">
                                <div
                                    class="h-full bg-gradient-to-r transition-all duration-300"
                                    :class="{
                                        'from-blue-500/20 to-purple-500/20': !isOverweight,
                                        'from-red-500/20 to-red-400/20': isOverweight,
                                    }"
                                    :style="{ width: `${getWeightPercentage}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="text-xs text-gray-500">
                        <span class="mr-2">Press</span>
                        <kbd class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-gray-400">1-5</kbd>
                        <span class="ml-2">to use items</span>
                    </div>
                    <div v-if="isOverweight" class="text-xs text-red-400">Carrying too much weight</div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="text-xs text-gray-500">Quick Access</div>
                    <div class="toolbar-container flex items-end justify-center space-x-2">
                        <!-- Toolbar Slots -->
                        <div
                            v-for="(item, index) in toolbarItems"
                            :key="index"
                            class="group relative"
                            @contextmenu.prevent="removeFromHotkey(index)"
                            @dragover.prevent
                            @drop.prevent="handleDrop($event, index)"
                            @dragenter.prevent="handleDragEnter(index)"
                            @dragleave.prevent="handleDragLeave(index)"
                        >
                            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">
                                {{ index + 1 }}
                            </div>

                            <div class="relative overflow-hidden">
                                <div
                                    class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                                    :class="{
                                        'group-hover:opacity-100': true,
                                        'opacity-100': activeDropSlot === index,
                                    }"
                                ></div>

                                <div
                                    class="relative h-[72px] w-[72px] rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm transition-all duration-300"
                                    :class="{
                                        'border-blue-500/50': activeDropSlot === index,
                                        'group-hover:border-white/30': activeDropSlot !== index,
                                    }"
                                >
                                    <div
                                        v-if="!item"
                                        class="flex h-full w-full items-center justify-center text-gray-600"
                                    ></div>

                                    <div v-else class="h-full w-full">
                                        <div class="relative h-full w-full p-1">
                                            <img
                                                :src="item.icon"
                                                :alt="item.name"
                                                class="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                                <div class="truncate text-xs font-medium text-gray-300">
                                                    {{ item.name }}
                                                </div>
                                            </div>
                                            <div
                                                v-if="item.quantity > 1"
                                                class="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-gray-300 backdrop-blur-sm"
                                            >
                                                {{ item.quantity }}x
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { InventoryConfig } from '../../shared/config';
import { Item } from '@Shared/types/items';

const props = defineProps<{
    totalWeight: string;
    toolbarItems: (Item | null)[];
}>();

const emit = defineEmits<{
    (e: 'use-item', item: Item): void;
    (e: 'remove-hotkey', slot: number): void;
    (e: 'assign-hotkey', item: Item, slot: number): void;
}>();

const activeDropSlot = ref<number | null>(null);

const getWeightPercentage = computed(() => {
    return Math.min((parseFloat(props.totalWeight) / InventoryConfig.itemManager.weight.maxWeight) * 100, 100);
});

const isOverweight = computed(() => {
    return parseFloat(props.totalWeight) > InventoryConfig.itemManager.weight.maxWeight;
});

// Drag and Drop handlers
const handleDrop = async (event: DragEvent, index: number) => {
    event.preventDefault();
    const itemData = event.dataTransfer?.getData('application/json');
    if (itemData) {
        try {
            const item = JSON.parse(itemData);
            console.log('[DEBUG] Dropping item into toolbar slot:', { item, slot: index });
            emit('assign-hotkey', item, index);
        } catch (error) {
            console.error('[DEBUG] Error handling toolbar drop:', error);
        }
    }
    activeDropSlot.value = null;
};

const handleDragEnter = (index: number) => {
    event?.preventDefault();
    console.log('[DEBUG] Drag entered toolbar slot:', index);
    activeDropSlot.value = index;
};

const handleDragLeave = (index: number) => {
    event?.preventDefault();
    if (activeDropSlot.value === index) {
        console.log('[DEBUG] Drag left toolbar slot:', index);
        activeDropSlot.value = null;
    }
};

const removeFromHotkey = (index: number) => {
    console.log('[DEBUG] Removing item from toolbar slot:', index);
    emit('remove-hotkey', index);
};
</script>

<style scoped>
.toolbar-container {
    position: relative;
    z-index: 50;
}

.toolbar-slot-hover {
    @apply border-blue-500/50;
}

.toolbar-slot-active {
    @apply border-blue-500;
}
</style>
