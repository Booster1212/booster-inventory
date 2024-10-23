<!-- Toolbar.vue -->
<template>
    <div class="flex items-end justify-center space-x-2">
        <div v-for="n in 5" :key="n" class="group relative">
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">
                {{ n }}
            </div>

            <div class="relative overflow-hidden" @contextmenu.prevent="handleRemoveItem(n - 1)">
                <div
                    class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                ></div>

                <div
                    class="relative h-[72px] w-[72px] rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm transition-all duration-300 group-hover:border-white/30"
                >
                    <div
                        v-if="!toolbarItems[n - 1]"
                        class="flex h-full w-full items-center justify-center text-gray-600"
                    ></div>

                    <div v-else class="h-full w-full">
                        <div class="relative h-full w-full p-1">
                            <img
                                :src="toolbarItems[n - 1].icon"
                                :alt="toolbarItems[n - 1].name"
                                class="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                                <div class="truncate text-xs font-medium text-gray-300">
                                    {{ toolbarItems[n - 1].name }}
                                </div>
                            </div>
                            <div
                                v-if="toolbarItems[n - 1].quantity > 1"
                                class="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-gray-300 backdrop-blur-sm"
                            >
                                {{ toolbarItems[n - 1].quantity }}x
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Item } from '@Shared/types/items';

const props = defineProps<{
    toolbarItems: (Item | null)[];
}>();

const emit = defineEmits<{
    (e: 'remove-hotkey', slot: number): void;
}>();

const handleRemoveItem = (slot: number) => {
    emit('remove-hotkey', slot);
};
</script>
