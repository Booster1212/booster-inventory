<template>
    <div class="flex items-center gap-4">
        <KeybindInfo />
        <WeightWarning v-if="isOverweight" />
    </div>
</template>

<script setup lang="ts">
defineProps<{
    isOverweight: boolean;
}>();
</script>
