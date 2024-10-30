<template>
    <div class="group relative">
        <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">
            {{ index + 1 }}
        </div>

        <div class="relative overflow-hidden">
            <div
                class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300"
                :class="{ 'group-hover:opacity-100': true, 'opacity-100': isHovered }"
            ></div>

            <div
                class="relative h-[72px] w-[72px] rounded-lg border transition-all duration-300"
                :class="slotClasses"
                @contextmenu.prevent="$emit('remove')"
                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
                @mouseup.stop="handleMouseUp"
            >
                <div v-if="!item" class="flex h-full w-full items-center justify-center"></div>
                <div v-else class="h-full w-full">
                    <div class="relative h-full w-full p-1">
                        <img
                            :src="item.icon"
                            :alt="item.name"
                            class="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                        />

                        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                            <div class="truncate text-xs font-medium text-gray-300">
                                {{ item.name }}
                            </div>
                        </div>

                        <div
                            v-if="item.quantity > 1"
                            class="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-gray-300"
                        >
                            {{ item.quantity }}x
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Item } from '@Shared/types/items';

interface Props {
    item: Item | null;
    index: number;
}

interface Emits {
    (e: 'remove'): void;
    (e: 'assign-hotkey', item: Item): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isHovered = ref(false);

const slotClasses = computed(() => ({
    'border-white/5 bg-black/20': !isHovered.value,
    'border-blue-500/50 bg-black/30': isHovered.value,
    'group-hover:border-white/20': !isHovered.value && !props.item,
}));

const handleMouseEnter = () => {
    isHovered.value = true;
};

const handleMouseLeave = () => {
    isHovered.value = false;
};

const handleMouseUp = () => {
    if (props.item) {
        emit('assign-hotkey', props.item);
    }
};
</script>
