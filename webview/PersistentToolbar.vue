<template>
    <Transition name="fade">
        <div v-show="isVisible" class="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
            <div class="flex select-none items-end justify-center space-x-2">
                <div v-for="n in 5" :key="n" class="group relative">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-blue-400/80">
                        {{ n }}
                    </div>

                    <div class="relative overflow-hidden">
                        <div
                            class="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition-all duration-300 group-hover:opacity-100"
                        ></div>

                        <div
                            class="relative h-[72px] w-[72px] rounded-lg border border-white/5 bg-black/20 transition-all duration-300 group-hover:border-white/20"
                        >
                            <div
                                v-if="!toolbarItems[n - 1]"
                                class="flex h-full w-full items-center justify-center"
                            ></div>
                            <div v-else class="h-full w-full">
                                <div class="relative h-full w-full p-1">
                                    <img
                                        :src="toolbarItems[n - 1].icon"
                                        :alt="toolbarItems[n - 1].name"
                                        class="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                                        <div class="truncate text-xs font-medium text-gray-300">
                                            {{ toolbarItems[n - 1].name }}
                                        </div>
                                    </div>
                                    <div
                                        v-if="toolbarItems[n - 1].quantity > 1"
                                        class="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-gray-300"
                                    >
                                        {{ toolbarItems[n - 1].quantity }}x
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { InventoryEvents } from '../shared/events';
import { Item } from '@Shared/types/items.js';

const events = useEvents();
const toolbarItems = ref<(Item | null)[]>([null, null, null, null, null]);
const isVisible = ref(false);
const hideTimeout = ref<any | null>(null);
const STORAGE_KEY = 'inventory:toolbar';
const HIDE_DELAY = 5000; // 5 seconds

const validateToolbarItem = (item: unknown): item is Item => {
    if (!item || typeof item !== 'object') return false;
    return ['uid', 'id', 'name', 'icon', 'quantity', 'weight', 'maxStack'].every((prop) => prop in (item as object));
};

const validateToolbarItems = (items: unknown): items is (Item | null)[] =>
    Array.isArray(items) && items.length === 5 && items.every((item) => item === null || validateToolbarItem(item));

const loadToolbarFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const parsed = JSON.parse(stored);
        if (!validateToolbarItems(parsed)) return false;

        toolbarItems.value = parsed;
        return true;
    } catch (error) {
        console.error('Error loading toolbar from storage:', error);
        return false;
    }
};

const showToolbar = () => {
    isVisible.value = true;

    if (hideTimeout.value !== null) {
        clearTimeout(hideTimeout.value);
    }

    hideTimeout.value = setTimeout(() => {
        isVisible.value = false;
        hideTimeout.value = null;
    }, HIDE_DELAY);
};

onMounted(() => {
    loadToolbarFromStorage();

    events.on(InventoryEvents.Webview.Inventory_KeyPress, (keyNumber: number) => {
        console.log(`Current Key Press: ${keyNumber}`);
        showToolbar();
        const item = toolbarItems.value[keyNumber - 1];
        if (item) {
            events.emitServer(InventoryEvents.Server.Inventory_UseItem, item);
        }
    });

    events.on(InventoryEvents.Webview.Inventory_UpdateToolbar, (updatedItems: Array<Item | null>) => {
        if (validateToolbarItems(updatedItems)) {
            toolbarItems.value = updatedItems;
        }
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

.group:hover .absolute.blur {
    opacity: 1;
}

.group:hover img {
    transform: scale(1.1);
}
</style>
