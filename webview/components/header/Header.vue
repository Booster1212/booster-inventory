<template>
    <div class="relative border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm">
        <div class="relative mx-auto max-w-7xl p-6">
            <div class="mb-6 flex items-center justify-between">
                <h1 class="text-3xl font-bold tracking-tight text-white">Inventory</h1>
                <WeightIndicator
                    :total-weight="formattedWeight"
                    :max-weight="maxWeight"
                    :weight-percentage="weightPercentage"
                    :is-overweight="isOverweight"
                />
            </div>

            <div class="flex items-center justify-between">
                <HeaderInfo :is-overweight="isOverweight" />
                <QuickAccess
                    :toolbar-items="toolbarItems"
                    :current-drag-data="currentDragData"
                    @remove-hotkey="handleRemoveHotkey"
                    @assign-hotkey="handleAssignHotkey"
                    @swap-items="handleSwapToolbarItems"
                    @drag-start="handleDragStart"
                    @drag-end="handleDragEnd"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Item } from '@Shared/types/items';
import { InventoryConfig } from '../../../shared/config';
import { useItemValidation } from '../../composable/useItemValidation';
import { useEvents } from '@Composables/useEvents';

import WeightIndicator from './WeightIndicator.vue';
import HeaderInfo from './HeaderInfo.vue';
import QuickAccess from './QuickAccess.vue';

interface DragData {
    item: Item | null;
    sourceIndex: number | null;
    sourceType: 'inventory' | 'toolbar' | null;
}

interface Props {
    totalWeight: string;
    toolbarItems: Array<Item | null>;
    currentDragData: DragData;
}

interface Emits {
    (e: 'assign-hotkey', item: Item, slot: number): void;
    (e: 'remove-hotkey', slot: number): void;
    (e: 'drag-start', data: DragData): void;
    (e: 'drag-end'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const events = useEvents();
const { isValidItem } = useItemValidation();

const currentWeight = computed(() => parseFloat(props.totalWeight));
const maxWeight = computed(() => InventoryConfig.itemManager.weight.maxWeight);
const isOverweight = computed(() => currentWeight.value > maxWeight.value);
const weightPercentage = computed(() => Math.min((currentWeight.value / maxWeight.value) * 100, 100));
const formattedWeight = computed(() => currentWeight.value.toFixed(1));

const handleRemoveHotkey = (index: number) => {
    console.log('Header: handleRemoveHotkey called with index:', index);
    if (props.toolbarItems[index]) {
        emit('remove-hotkey', index);
    }
};

const handleAssignHotkey = (item: Item, slot: number) => {
    console.log('Header: handleAssignHotkey called with:', {
        itemUid: item?.uid,
        itemName: item?.name,
        slot,
        currentSlotItem: props.toolbarItems[slot]?.uid,
        currentDragData: props.currentDragData,
    });

    if (!item || !isValidItem(item)) {
        console.error('Header: Invalid item for hotkey assignment:', item);
        return;
    }

    emit('assign-hotkey', item, slot);
};

const handleSwapToolbarItems = (fromIndex: number, toIndex: number) => {
    console.log('Header: handleSwapToolbarItems called', {
        fromIndex,
        toIndex,
        fromItem: props.toolbarItems[fromIndex]?.uid,
        toItem: props.toolbarItems[toIndex]?.uid,
        currentDragData: props.currentDragData,
    });

    const fromItem = props.toolbarItems[fromIndex];
    const toItem = props.toolbarItems[toIndex];

    if (fromItem) {
        emit('assign-hotkey', fromItem, toIndex);
    }
    if (toItem) {
        emit('assign-hotkey', toItem, fromIndex);
    }
};

const handleDragStart = (data: DragData) => {
    console.log('Header: handleDragStart', data);
    emit('drag-start', data);
};

const handleDragEnd = () => {
    console.log('Header: handleDragEnd');
    emit('drag-end');
};

watch(
    () => props.toolbarItems,
    (newValue, oldValue) => {
        console.log('Header: toolbarItems changed:', {
            old: oldValue?.map((item) => item?.uid),
            new: newValue?.map((item) => item?.uid),
        });
    },
    { deep: true },
);

watch(
    () => props.currentDragData,
    (newValue) => {
        console.log('Header: currentDragData changed:', {
            item: newValue?.item?.uid,
            sourceIndex: newValue?.sourceIndex,
            sourceType: newValue?.sourceType,
        });
    },
    { deep: true },
);
</script>
