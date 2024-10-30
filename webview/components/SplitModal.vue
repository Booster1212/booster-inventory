<template>
    <Transition name="modal-fade">
        <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('update:modelValue', false)"></div>

            <div class="relative w-96 rounded-xl border border-white/10 bg-black/90 p-6 backdrop-blur-sm">
                <div class="mb-6">
                    <div class="mb-2 flex items-center gap-4">
                        <div class="h-12 w-12 overflow-hidden rounded-lg">
                            <img :src="item?.icon" :alt="item?.name" class="h-full w-full object-cover" />
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">Split Stack</h3>
                            <p class="text-sm text-gray-400">{{ item?.name }}</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="text-sm text-gray-400">Quantity to Split</label>
                            <span class="text-sm text-gray-400">{{ quantity }} / {{ maxQuantity }}</span>
                        </div>

                        <input
                            type="range"
                            :min="1"
                            :max="maxQuantity"
                            v-model="quantity"
                            class="w-full accent-blue-500"
                        />

                        <div class="flex gap-2">
                            <button
                                v-for="preset in splitPresets"
                                :key="preset"
                                @click="handlePresetClick(preset)"
                                class="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-gray-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                                :class="{ 'border-blue-500/30 bg-blue-500/10 text-blue-400': quantity === preset }"
                            >
                                {{ preset }}
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button
                            @click="$emit('update:modelValue', false)"
                            class="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:border-white/30 hover:bg-white/10"
                        >
                            Cancel
                        </button>

                        <button
                            @click="handleConfirm"
                            class="group relative flex-1 overflow-hidden rounded-lg"
                            :disabled="!isValid"
                        >
                            <div
                                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-400/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                            ></div>
                            <div
                                class="relative w-full rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent px-4 py-2 text-center text-sm font-medium text-blue-400 transition-all duration-300 group-hover:border-blue-500/30"
                                :class="{ 'cursor-not-allowed opacity-50': !isValid }"
                            >
                                Split Stack
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Item } from '@Shared/types/items';

interface Props {
    modelValue: boolean;
    item: Item | null;
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'split', item: Item, quantity: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const quantity = ref(1);
const maxQuantity = computed(() => (props.item ? props.item.quantity - 1 : 0));

const splitPresets = computed(() => {
    if (!props.item || props.item.quantity <= 1) return [];

    const max = props.item.quantity - 1;
    if (max <= 4) {
        return Array.from({ length: max }, (_, i) => i + 1);
    }
    return [1, Math.floor(max / 2), max];
});

const isValid = computed(() => props.item && quantity.value >= 1 && quantity.value < props.item.quantity);

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue && props.item) {
            quantity.value = 1;
        }
    },
);

const handlePresetClick = (value: number) => {
    if (value >= 1 && props.item && value < props.item.quantity) {
        quantity.value = value;
    }
};

const handleConfirm = () => {
    if (props.item && isValid.value) {
        emit('split', props.item, quantity.value);
        emit('update:modelValue', false);
    }
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
}

input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(59, 130, 246);
    cursor: pointer;
    transition: all 0.2s ease;
}

input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    background: rgb(96, 165, 250);
}

input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: rgb(59, 130, 246);
    cursor: pointer;
    transition: all 0.2s ease;
}

input[type='range']::-moz-range-thumb:hover {
    transform: scale(1.1);
    background: rgb(96, 165, 250);
}
</style>
