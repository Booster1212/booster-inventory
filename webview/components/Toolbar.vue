<template>
    <div class="flex items-end justify-center space-x-2">
        <div v-for="n in 5" :key="n" class="relative">
            <!-- Number indicator above -->
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">
                {{ n }}
            </div>

            <!-- Toolbar slot -->
            <div
                class="relative h-[72px] w-[72px] rounded bg-black/80 transition-all hover:bg-black/60"
                @contextmenu.prevent="$emit('remove-hotkey', n - 1)"
            >
                <!-- Empty slot state -->
                <div
                    v-if="!toolbarItems[n - 1]"
                    class="flex h-full w-full items-center justify-center border border-white/5 text-gray-600"
                ></div>

                <!-- Item in slot -->
                <div v-else class="h-full w-full">
                    <div class="relative h-full w-full p-1">
                        <img
                            :src="toolbarItems[n - 1].icon"
                            :alt="toolbarItems[n - 1].name"
                            class="h-full w-full rounded object-cover"
                        />
                        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                            <div class="truncate text-xs text-gray-400">
                                {{ toolbarItems[n - 1].name }}
                            </div>
                        </div>
                        <div
                            v-if="toolbarItems[n - 1].quantity > 1"
                            class="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-xs"
                        >
                            {{ toolbarItems[n - 1].quantity }}x
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Item } from '@Shared/types/items';

defineProps<{
    toolbarItems: (Item | null)[];
}>();

defineEmits<{
    (e: 'remove-hotkey', slot: number): void;
}>();
</script>
