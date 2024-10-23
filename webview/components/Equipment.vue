<template>
    <div class="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur-sm">
        <h3 class="mb-6 text-xl font-bold tracking-tight">Equipment</h3>
        <div class="grid grid-cols-2 gap-4">
            <div v-for="slot in equipmentSlots" :key="slot.id" class="group relative aspect-square">
                <div
                    class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                ></div>
                <div
                    class="relative h-full w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-3 transition-all duration-300 group-hover:border-white/30"
                >
                    <div v-if="!slot.item" class="flex h-full w-full flex-col items-center justify-center">
                        <div
                            class="mb-2 text-3xl opacity-50 transition-all duration-300 group-hover:scale-110 group-hover:opacity-80"
                        >
                            {{ slot.icon }}
                        </div>
                        <div
                            class="text-center text-xs font-medium text-gray-500 transition-all duration-300 group-hover:text-gray-300"
                        >
                            {{ slot.name }}
                        </div>
                    </div>
                    <div v-else class="relative h-full w-full overflow-hidden rounded-lg">
                        <img
                            :src="slot.item.icon"
                            :alt="slot.item.name"
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                            <div class="truncate text-xs font-medium text-gray-300">
                                {{ slot.item.name }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { EquipmentSlot } from '../../shared/types';

defineProps<{
    equipmentSlots: Array<EquipmentSlot>;
}>();
</script>
