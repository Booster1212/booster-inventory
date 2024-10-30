<template>
    <div class="group relative w-64">
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
                        <span class="text-gray-500">{{ maxWeight }}</span>
                    </div>
                    <div v-if="isOverweight" class="mt-1 text-xs text-red-400">Weight overweight</div>
                </div>

                <div class="h-8 w-24 overflow-hidden rounded-md">
                    <div
                        class="animate-weight-bar-fill h-full w-full rounded-md bg-gradient-to-r transition-all duration-300"
                        :class="barClass"
                        :style="{ width: `${weightPercentage}%` }"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    totalWeight: string;
    maxWeight: number;
    weightPercentage: number;
    isOverweight: boolean;
}

const props = defineProps<Props>();

const barClass = computed(() => ({
    'from-blue-500/50 to-purple-500/50': !props.isOverweight,
    'from-red-500/50 to-red-400/50': props.isOverweight,
}));
</script>

<style scoped>
@keyframes weight-bar-fill {
    0% {
        background-size: 0% 100%;
    }
    100% {
        background-size: 100% 100%;
    }
}

.animate-weight-bar-fill {
    background-size: 100% 100%;
    background-repeat: no-repeat;
    animation: weight-bar-fill 1s ease-out;
}
</style>
