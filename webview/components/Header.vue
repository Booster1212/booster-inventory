<template>
    <div class="relative border-b border-white/10 bg-gradient-to-b from-black to-transparent p-8">
        <div class="absolute inset-0 bg-blue-500/5 backdrop-blur-sm"></div>
        <div class="relative mx-auto max-w-7xl">
            <div class="mb-8 flex items-center justify-between">
                <!-- Left side with title and weight -->
                <div class="space-y-2">
                    <h1
                        class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-5xl font-black tracking-tight text-transparent"
                    >
                        Inventory
                    </h1>
                    <div class="flex items-center space-x-4">
                        <div class="rounded-lg bg-white/5 px-4 py-2 backdrop-blur-sm">
                            <span class="text-sm text-gray-400">Total Weight</span>
                            <div class="text-xl font-bold">
                                <span class="text-white">{{ totalWeight }}</span>
                                <span class="text-gray-400">/50.0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <ToolbarComponent :toolbarItems="toolbarItems" @remove-hotkey="$emit('remove-hotkey', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Item } from '@Shared/types/items';
import ToolbarComponent from './Toolbar.vue';

defineProps<{
    totalWeight: string;
    toolbarItems: (Item | null)[];
}>();

defineEmits<{
    (e: 'remove-hotkey', slot: number): void;
}>();
</script>
