<template>
    <Transition name="fade" mode="out-in">
        <div
            v-if="selectedItem"
            class="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
        >
            <div class="mb-6 flex items-start justify-between">
                <div>
                    <h2 class="text-2xl font-bold">{{ selectedItem.name }}</h2>
                    <div class="mt-2 flex items-center space-x-4">
                        <div class="rounded bg-white/5 px-2 py-1 text-sm">
                            <span class="text-gray-400">Weight:</span>
                            <span class="ml-1 font-medium">{{ selectedItem.weight }}kg</span>
                        </div>
                        <div class="rounded bg-white/5 px-2 py-1 text-sm">
                            <span class="text-gray-400">Stack:</span>
                            <span class="ml-1 font-medium">{{ selectedItem.maxStack }}</span>
                        </div>
                    </div>
                </div>
                <button
                    @click="$emit('close')"
                    class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                    ❌
                </button>
            </div>
            <div class="mb-6">
                <h3 class="mb-2 text-sm font-semibold text-gray-400">Description</h3>
                <p class="text-sm leading-relaxed text-gray-300">{{ selectedItem.desc }}</p>
            </div>
            <div v-if="selectedItem.data" class="mb-6">
                <h3 class="mb-3 text-sm font-semibold text-gray-400">Properties</h3>
                <div class="space-y-2">
                    <div
                        v-for="(value, key) in selectedItem.data"
                        :key="key"
                        class="flex justify-between rounded-lg bg-white/5 p-3 text-sm backdrop-blur-sm"
                    >
                        <span class="font-medium capitalize">{{ formatKey(key) }}</span>
                        <span class="text-gray-300">{{ value }}</span>
                    </div>
                </div>
            </div>
            <div class="mb-6">
                <h3 class="mb-3 text-sm font-semibold text-gray-400">Assign Hotkey</h3>
                <div class="flex space-x-2">
                    <button
                        v-for="n in 5"
                        :key="n"
                        @click="$emit('assign-hotkey', selectedItem, n - 1)"
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-gradient-to-r from-white/5 to-transparent text-sm transition-all hover:border-white/40"
                        :class="{
                            'border-blue-500/50 from-blue-500/20': getHotkeyNumber(selectedItem) === n,
                        }"
                    >
                        {{ n }}
                    </button>
                </div>
            </div>
            <div class="space-y-3">
                <button
                    class="w-full rounded-lg border border-white/20 bg-gradient-to-r from-blue-500/20 to-blue-500/10 p-3 font-medium text-white transition-all hover:border-white/40 hover:from-blue-500/30 hover:to-blue-500/20 active:scale-95"
                    @click="$emit('use-item', selectedItem)"
                >
                    Use Item
                </button>
                <button
                    class="w-full rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/20 to-red-500/10 p-3 font-medium text-red-400 transition-all hover:border-red-500/40 hover:from-red-500/30 hover:to-red-500/20 active:scale-95"
                    @click="$emit('drop-item', selectedItem)"
                >
                    Drop Item
                </button>
            </div>
        </div>
        <div
            v-else
            class="flex h-[400px] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-8 text-center backdrop-blur-sm"
        >
            <div>
                <div class="mb-3 text-5xl">ℹ️</div>
                <div class="text-lg font-medium text-gray-400">Select an item to view details</div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { Item } from '@Shared/types/items.js';

const props = defineProps<{
    selectedItem: Item | null;
    toolbarItems: Array<Item | null>;
}>();

const getHotkeyNumber = (item: Item): number | null => {
    const index = props.toolbarItems.findIndex((i) => i?.uid === item.uid);
    return index !== -1 ? index + 1 : null;
};

const formatKey = (key: string | number): string => {
    return String(key).replace(/_/g, ' ');
};
</script>
