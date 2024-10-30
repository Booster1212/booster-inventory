<template>
    <div
        class="h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm"
    >
        <h3 class="mb-4 text-xl font-bold tracking-tight">Equipment</h3>

        <!-- Category Buttons -->
        <div class="mb-4 flex justify-center">
            <button
                @click="selectedCategory = 'clothing'"
                :class="{ 'bg-blue-500 text-white': selectedCategory === 'clothing' }"
                class="rounded-l-lg border border-white/10 px-4 py-2 transition-all duration-300 hover:bg-blue-500 hover:text-white"
            >
                Clothing
            </button>
            <button
                @click="selectedCategory = 'props'"
                :class="{ 'bg-purple-500 text-white': selectedCategory === 'props' }"
                class="rounded-r-lg border border-white/10 px-4 py-2 transition-all duration-300 hover:bg-purple-500 hover:text-white"
            >
                Props
            </button>
        </div>

        <!-- Scrollable Equipment Slots Container with Custom Scrollbar -->
        <div class="custom-scrollbar h-[calc(100%-6rem)] overflow-y-auto p-2">
            <div class="grid grid-cols-2 gap-4">
                <div v-for="slot in filteredSlots" :key="slot.id" class="group relative flex h-28 w-full flex-col">
                    <div
                        class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                    ></div>

                    <div
                        class="relative h-full w-full flex-1 rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent transition-all duration-300"
                    >
                        <template v-if="!slot.item">
                            <div class="flex h-full w-full flex-col items-center justify-center">
                                <div
                                    class="text-3xl opacity-50 transition-all duration-300 group-hover:scale-110 group-hover:opacity-80"
                                >
                                    {{ slot.icon }}
                                </div>
                            </div>
                        </template>

                        <template v-else>
                            <div class="relative h-full w-full overflow-hidden rounded-lg">
                                <img
                                    :src="slot.item.icon"
                                    :alt="slot.item.name"
                                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    draggable="false"
                                />
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                    <div class="truncate text-xs font-medium text-gray-300">
                                        {{ slot.item.name }}
                                    </div>
                                    <div class="mt-1 text-xs text-gray-500">
                                        {{ slot.name }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="mt-1 text-center text-xs text-gray-600">
                        {{ slot.name }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { EquipmentSlot } from '../../shared/types';

const props = defineProps<{ equipmentSlots: EquipmentSlot[] }>();

const selectedCategory = ref('clothing');

const filteredSlots = computed(() => {
    if (selectedCategory.value === 'clothing') {
        return props.equipmentSlots.filter((slot) =>
            [
                'head',
                'masks',
                'hair_styles',
                'torsos',
                'legs',
                'bags',
                'shoes',
                'accessories',
                'undershirts',
                'body_armors',
                'decals',
                'tops',
            ].includes(slot.id),
        );
    } else if (selectedCategory.value === 'props') {
        return props.equipmentSlots.filter((slot) =>
            ['hats', 'glasses', 'ears', 'watches', 'bracelets'].includes(slot.id),
        );
    }
    return [];
});
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

/* Custom Scrollbar Styling */
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
