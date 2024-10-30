<template>
    <Transition name="fade">
        <div v-show="isVisible" class="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
            <div class="flex select-none items-end justify-center space-x-2">
                <ToolbarSlot v-for="(item, index) in toolbarItems" :key="index" :item="item" :index="index" />
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Item } from '@Shared/types/items';
import { useEvents } from '@Composables/useEvents';
import { useToolbar } from './composable/useToolbar';
import { useItemValidation } from './composable/useItemValidation';
import { InventoryEvents } from '../shared/events';
import ToolbarSlot from './components/toolbar/ToolbarSlot.vue';

const events = useEvents();
const { toolbarItems, loadToolbarFromStorage, saveToolbarToStorage } = useToolbar();
const { isValidItem } = useItemValidation();

const isVisible = ref(false);
const hideTimeout = ref<number | null>(null);
const HIDE_DELAY = 5000;

const showToolbar = () => {
    isVisible.value = true;

    if (hideTimeout.value !== null) {
        clearTimeout(hideTimeout.value);
    }

    hideTimeout.value = window.setTimeout(() => {
        isVisible.value = false;
        hideTimeout.value = null;
    }, HIDE_DELAY);
};

onMounted(() => {
    loadToolbarFromStorage();

    events.on(InventoryEvents.Webview.Inventory_KeyPress, (keyNumber: number) => {
        showToolbar();
        const item = toolbarItems.value[keyNumber - 1];
        if (item && isValidItem(item)) {
            events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
        }
    });

    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (updatedItems: Array<Item | null>) => {
        const validItems = updatedItems.map((item) => (item && isValidItem(item) ? item : null));
        toolbarItems.value = validItems;
        saveToolbarToStorage();
    });
});

onUnmounted(() => {
    if (hideTimeout.value !== null) {
        clearTimeout(hideTimeout.value);
    }
});

watch(
    toolbarItems,
    () => {
        saveToolbarToStorage();
    },
    { deep: true },
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.6s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>
