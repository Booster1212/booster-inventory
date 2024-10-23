<template>
    <div class="grid grid-cols-4 gap-4">
        <div
            v-for="item in inventory"
            :key="item.uid"
            class="group relative aspect-square cursor-pointer"
            @click="$emit('select-item', item)"
        >
            <div
                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
            ></div>
            <div
                class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 group-hover:border-white/30"
            >
                <div class="relative h-full w-full overflow-hidden rounded-lg">
                    <img
                        :src="item.icon"
                        :alt="item.name"
                        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                        <div class="truncate text-xs font-medium text-gray-300">
                            {{ item.name }}
                        </div>
                    </div>
                    <div
                        v-if="item.quantity > 1"
                        class="absolute right-2 top-2 rounded-md bg-black/80 px-2 py-1 text-xs font-medium backdrop-blur-sm"
                    >
                        {{ item.quantity }}x
                    </div>
                    <div
                        v-if="getHotkeyNumber(item)"
                        class="absolute left-2 top-2 rounded bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300"
                    >
                        {{ getHotkeyNumber(item) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Item } from '@Shared/types/items.js';

const props = defineProps<{
    inventory: Array<Item>;
    toolbarItems: Array<Item | null>;
}>();

const getHotkeyNumber = (item: Item): number | null => {
    const index = props.toolbarItems.findIndex((i) => i?.uid === item.uid);
    return index !== -1 ? index + 1 : null;
};
</script>
