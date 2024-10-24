<template>
    <div class="flex h-[70vh] flex-col">
        <Transition name="fade" mode="out-in">
            <div
                v-if="selectedItem"
                class="flex h-full select-none flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm"
            >
                <!-- Header -->
                <div class="border-b border-white/10 p-6">
                    <div
                        class="mb-4 inline-block rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase text-blue-400"
                    >
                        {{ getItemType(selectedItem) }}
                    </div>

                    <h2 class="text-xl font-bold tracking-tight text-white">
                        {{ selectedItem.name }}
                    </h2>
                </div>

                <!-- Content -->
                <div class="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                    <!-- Main Stats -->
                    <div class="grid grid-cols-2 gap-4">
                        <div
                            class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 hover:border-white/30"
                        >
                            <div class="text-xs text-gray-500">Weight</div>
                            <div class="mt-1 text-sm font-medium text-white">{{ selectedItem.weight }}kg</div>
                        </div>
                        <div
                            class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 hover:border-white/30"
                        >
                            <div class="text-xs text-gray-500">Stack</div>
                            <div class="mt-1 text-sm font-medium text-white">{{ selectedItem.maxStack }}</div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3">
                        <p class="text-sm leading-relaxed text-gray-400">{{ selectedItem.desc }}</p>
                    </div>

                    <!-- Properties -->
                    <div v-if="Object.keys(selectedItem.data).length">
                        <button
                            @click="isPropertiesVisible = !isPropertiesVisible"
                            class="mb-3 flex w-full items-center justify-between text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-300"
                        >
                            <span>Properties</span>
                            <span
                                class="transform transition-transform duration-200"
                                :class="{ 'rotate-180': !isPropertiesVisible }"
                            >
                                ▼
                            </span>
                        </button>
                        <Transition name="slide">
                            <div v-show="isPropertiesVisible" class="grid gap-2">
                                <div
                                    v-for="[key, value] in Object.entries(selectedItem.data)"
                                    :key="key"
                                    class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 hover:border-white/30"
                                >
                                    <div class="text-xs text-gray-500">{{ formatKey(key) }}</div>
                                    <div class="mt-1 text-sm font-medium" :class="getValueColor(key, value)">
                                        {{ formatValue(key, value) }}
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <!-- Quick Access -->
                    <div>
                        <button
                            @click="isQuickAccessVisible = !isQuickAccessVisible"
                            class="mb-3 flex w-full items-center justify-between text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-300"
                        >
                            <span>Quick Access</span>
                            <span
                                class="transform transition-transform duration-200"
                                :class="{ 'rotate-180': !isQuickAccessVisible }"
                            >
                                ▼
                            </span>
                        </button>
                        <Transition name="slide">
                            <div v-show="isQuickAccessVisible" class="grid grid-cols-5 gap-2">
                                <button
                                    v-for="n in 5"
                                    :key="n"
                                    @click="$emit('assign-hotkey', selectedItem, n - 1)"
                                    class="group relative aspect-square overflow-hidden"
                                >
                                    <div
                                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                                    ></div>
                                    <div
                                        class="relative flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent transition-all duration-300 group-hover:border-white/30"
                                        :class="[
                                            getHotkeyNumber(selectedItem) === n
                                                ? 'border-blue-500/50 from-blue-500/20'
                                                : '',
                                        ]"
                                    >
                                        <span
                                            class="text-sm transition-all duration-300 group-hover:scale-110"
                                            :class="[
                                                getHotkeyNumber(selectedItem) === n
                                                    ? 'text-blue-400'
                                                    : 'text-gray-500 group-hover:text-gray-300',
                                            ]"
                                        >
                                            {{ n }}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </Transition>
                    </div>
                </div>

                <!-- Actions -->
                <div class="border-t border-white/10 p-6">
                    <div class="grid gap-3">
                        <button
                            @click="$emit('use-item', selectedItem)"
                            class="group relative w-full overflow-hidden rounded-lg"
                        >
                            <div
                                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-400/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                            ></div>
                            <div
                                class="relative w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 text-center font-medium text-blue-400 transition-all duration-300 group-hover:border-blue-500/30"
                            >
                                Use Item
                            </div>
                        </button>
                        <button
                            @click="$emit('drop-item', selectedItem)"
                            class="group relative w-full overflow-hidden rounded-lg"
                        >
                            <div
                                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-red-500/20 to-red-400/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                            ></div>
                            <div
                                class="relative w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 text-center font-medium text-red-400 transition-all duration-300 group-hover:border-red-500/30"
                            >
                                Drop Item
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div
                v-else
                class="flex h-[70vh] select-none items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-8 text-center backdrop-blur-sm"
            >
                <div>
                    <div class="mb-3 text-3xl opacity-50">👆</div>
                    <div class="text-sm font-medium text-gray-500">Select an item to view details</div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Item } from '@Shared/types/items';

const props = defineProps<{
    selectedItem: Item | null;
    toolbarItems: Array<Item | null>;
}>();

const isPropertiesVisible = ref(true);
const isQuickAccessVisible = ref(true);

const getItemType = (item: Item): string => {
    if (item.id.includes('weapon')) return 'Weapon';
    if (item.id.includes('medical')) return 'Medical';
    if (item.id.includes('armor')) return 'Armor';
    return 'Item';
};

const getHotkeyNumber = (item: Item): number | null => {
    const index = props.toolbarItems.findIndex((i) => i?.uid === item.uid);
    return index !== -1 ? index + 1 : null;
};

const formatKey = (key: string): string => {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatValue = (key: string, value: any): string => {
    if (key === 'condition') return `${value}%`;
    if (key === 'healing') return `+${value} HP`;
    if (key === 'accuracy') return `${value}%`;
    return value.toString();
};

const getValueColor = (key: string, value: any): string => {
    if (key === 'condition') {
        if (value > 80) return 'text-green-400';
        if (value > 50) return 'text-yellow-400';
        return 'text-red-400';
    }
    return 'text-white';
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 150ms ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

.slide-enter-active,
.slide-leave-active {
    transition: all 200ms ease-out;
    max-height: 1000px;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
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
