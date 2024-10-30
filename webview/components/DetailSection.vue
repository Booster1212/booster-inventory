<template>
    <div class="flex h-[70vh] flex-col">
        <Transition name="fade" mode="out-in">
            <div
                v-if="selectedItem"
                class="flex h-full select-none flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm"
                draggable="true"
                @dragstart="handleDragStart"
            >
                <div class="border-b border-white/10 p-6">
                    <div
                        class="mb-4 inline-block rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30 px-3 py-1 text-xs font-medium uppercase text-blue-400"
                    >
                        {{ itemType }}
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight text-white">{{ selectedItem.name }}</h2>
                </div>

                <div class="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                    <!-- Item Stats -->
                    <div class="grid grid-cols-2 gap-4">
                        <div
                            class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 hover:border-white/30"
                        >
                            <div class="text-xs text-gray-500">Weight</div>
                            <div class="mt-1 text-sm font-medium text-white">
                                {{ selectedItem.weight * selectedItem.quantity }}kg
                            </div>
                        </div>
                        <div
                            class="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 hover:border-white/30"
                        >
                            <div class="text-xs text-gray-500">Stack</div>
                            <div class="mt-1 text-sm font-medium text-white">{{ selectedItem.maxStack }}</div>
                        </div>
                    </div>

                    <!-- Item Description -->
                    <div class="rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3">
                        <p class="text-sm leading-relaxed text-gray-400">{{ selectedItem.desc }}</p>
                    </div>

                    <!-- Item Properties -->
                    <div v-if="hasProperties">
                        <button
                            @click="isPropertiesVisible = !isPropertiesVisible"
                            class="mb-3 flex w-full items-center justify-between text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-300"
                        >
                            <span>Properties</span>
                            <span
                                class="transform transition-transform duration-200"
                                :class="{ 'rotate-180': !isPropertiesVisible }"
                                >▼</span
                            >
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
                    <!-- <div>
                        <button
                            @click="isQuickAccessVisible = !isQuickAccessVisible"
                            class="mb-3 flex w-full items-center justify-between text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-300"
                        >
                            <span>Quick Access</span>
                            <span
                                class="transform transition-transform duration-200"
                                :class="{ 'rotate-180': !isQuickAccessVisible }"
                                >▼</span
                            >
                        </button>
                        <Transition name="slide">
                            <div v-show="isQuickAccessVisible" class="grid grid-cols-5 gap-2">
                                <button
                                    v-for="n in 5"
                                    :key="n"
                                    class="group relative aspect-square overflow-hidden"
                                    @click="emit('assign-hotkey', selectedItem, n - 1)"
                                    @contextmenu.prevent="emit('remove-hotkey', n - 1)"
                                >
                                    <div
                                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                                    ></div>
                                    <div
                                        class="relative flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent transition-all duration-300 group-hover:border-white/30"
                                        :class="{
                                            'border-blue-500/50 from-blue-500/20': currentSlot === n - 1,
                                            'border-yellow-500/50': isSlotOccupied(n - 1) && currentSlot !== n - 1,
                                        }"
                                    >
                                        <div class="flex flex-col items-center gap-1">
                                            <span
                                                class="text-lg transition-all duration-300 group-hover:scale-110"
                                                :class="{
                                                    'text-blue-400': currentSlot === n - 1,
                                                    'text-yellow-500': isSlotOccupied(n - 1) && currentSlot !== n - 1,
                                                    'text-gray-500 group-hover:text-gray-300': !isSlotOccupied(n - 1),
                                                }"
                                                >{{ n }}</span
                                            >
                                            <div
                                                v-if="isSlotOccupied(n - 1) && currentSlot !== n - 1"
                                                class="absolute inset-0 overflow-hidden rounded-lg"
                                            >
                                                <img
                                                    :src="toolbarItems[n - 1].icon"
                                                    :alt="toolbarItems[n - 1].name"
                                                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </Transition>
                    </div> -->
                </div>

                <!-- Action Buttons -->
                <div class="border-t border-white/10 p-6">
                    <div class="grid gap-3">
                        <button
                            class="group relative w-full overflow-hidden rounded-lg"
                            @click="emit('use-item', selectedItem)"
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
                            class="group relative w-full overflow-hidden rounded-lg"
                            @click="emit('drop-item', selectedItem)"
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
import { ref, computed } from 'vue';
import { Item } from '@Shared/types/items';

interface Props {
    selectedItem: Item | null;
    toolbarItems: Array<Item | null>;
}

interface Emits {
    (e: 'use-item', item: Item): void;
    (e: 'drop-item', item: Item): void;
    (e: 'assign-hotkey', item: Item, slot: number): void;
    (e: 'remove-hotkey', slot: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isPropertiesVisible = ref(true);

const itemType = computed(() => {
    if (!props.selectedItem?.id) return '';
    if (props.selectedItem.id.toString().includes('weapon')) return 'Weapon';
    if (props.selectedItem.id.toString().includes('medical')) return 'Medical';
    if (props.selectedItem.id.toString().includes('armor')) return 'Armor';
    if (props.selectedItem.id.toString().includes('food')) return 'Food';
    return 'Item';
});

const hasProperties = computed(() => props.selectedItem && Object.keys(props.selectedItem.data).length > 0);

const handleDragStart = (event: DragEvent) => {
    if (!props.selectedItem || !event.dataTransfer) return;

    event.dataTransfer.setData('application/json', JSON.stringify(props.selectedItem));
    event.dataTransfer.effectAllowed = 'move';

    const img = new Image();
    img.src = props.selectedItem.icon;
    event.dataTransfer.setDragImage(img, 36, 36);
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
    transition: all 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
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
