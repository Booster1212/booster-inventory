<template>
    <Transition name="fade">
        <div v-show="isVisible" class="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
            <div class="flex select-none items-end justify-center space-x-2">
                <ToolbarSlot
                    v-for="(item, index) in toolbarItems"
                    :key="index"
                    :item="item"
                    :index="index"
                    @use-item="handleUseItem"
                />
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Item } from '@Shared/types/items';
import { useEvents } from '@Composables/useEvents';
import { useToolbar } from './composable/useToolbar';
import { useItemValidation } from './composable/useItemValidation';
import { InventoryEvents } from '../shared/events';
import ToolbarSlot from './components/toolbar/ToolbarSlot.vue';

const events = useEvents();
const { toolbarItems, loadToolbar } = useToolbar();
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

const handleUseItem = async (item: Item) => {
    console.log('Item', JSON.stringify(item, undefined, 4));
    if (item && isValidItem(item)) {
        try {
            events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
            showToolbar();
        } catch (error) {
            console.error('Error using item:', error);
        }
    }
};

const handleKeyPress = async (keyNumber: number) => {
    showToolbar();
    console.log('Key pressed:', keyNumber);

    if (keyNumber < 1 || keyNumber > toolbarItems.value.length) return;

    const item = toolbarItems.value[keyNumber - 1];
    console.log('Item:', item);

    if (item && isValidItem(item)) {
        await handleUseItem(item);
    }
};

onMounted(async () => {
    await loadToolbar();

    events.on(InventoryEvents.Webview.Inventory_KeyPress, handleKeyPress);
    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (updatedItems: Array<Item | null>) => {
        showToolbar();
        toolbarItems.value = updatedItems.map((item) => (item && isValidItem(item) ? item : null));
    });
});

onUnmounted(() => {
    if (hideTimeout.value !== null) {
        clearTimeout(hideTimeout.value);
    }
});
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
