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
                                    <span class="text-gray-500">50.0</span>
                                </div>
                            </div>
                            <div class="h-8 w-24 overflow-hidden rounded-md border border-white/5 bg-white/5">
                                <div
                                    class="h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-all duration-300"
                                    :style="{ width: `${getWeightPercentage}%` }"
                                    :class="{ 'from-red-500/20 to-red-400/20': isOverweight }"
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
                    <ToolbarComponent
                        :toolbarItems="toolbarItems"
                        @remove-hotkey="handleRemoveHotkey"
                        @use-item="handleUseItem"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { Item } from '@Shared/types/items';
import ToolbarComponent from './Toolbar.vue';

const props = defineProps<{
    totalWeight: string;
    toolbarItems: (Item | null)[];
}>();

const emit = defineEmits<{
    (e: 'remove-hotkey', slot: number): void;
    (e: 'use-item', item: Item): void;
}>();

const getWeightPercentage = computed(() => {
    return Math.min((parseFloat(props.totalWeight) / 50) * 100, 100);
});

const isOverweight = computed(() => {
    return parseFloat(props.totalWeight) > 50;
});

const handleKeyPress = (event: KeyboardEvent) => {
    const num = parseInt(event.key);
    if (num >= 1 && num <= 5) {
        const item = props.toolbarItems[num - 1];
        if (item) {
            handleUseItem(item);
        }
    }
};

const handleUseItem = (item: Item) => {
    if (!isOverweight.value) {
        emit('use-item', item);
    }
};

const handleRemoveHotkey = (slot: number) => {
    emit('remove-hotkey', slot);
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
});
</script>
