import { Item } from '@Shared/types/items.js';
import { ref, onUnmounted } from 'vue';
import { useItemValidation } from './useItemValidation.js';

export function useDragAndDrop() {
    const { isValidItem } = useItemValidation();

    const isDragging = ref(false);
    const draggedItem = ref<Item | null>(null);
    const dragSourceIndex = ref<number | null>(null);
    const cursorPos = ref({ x: 0, y: 0 });
    const mouseDownTimer = ref<number | null>(null);
    const mouseDownPos = ref({ x: 0, y: 0 });
    const currentHoverIndex = ref<number | null>(null);
    const DRAG_DELAY = 200;

    const cleanupDragState = () => {
        isDragging.value = false;
        draggedItem.value = null;
        dragSourceIndex.value = null;
        currentHoverIndex.value = null;
        if (mouseDownTimer.value !== null) {
            clearTimeout(mouseDownTimer.value);
            mouseDownTimer.value = null;
        }
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleMouseDown = (event: MouseEvent, index: number, item: Item | null) => {
        if (!item || !isValidItem(item)) return;

        mouseDownPos.value = { x: event.clientX, y: event.clientY };
        cursorPos.value = { x: event.clientX, y: event.clientY };

        if (mouseDownTimer.value !== null) {
            clearTimeout(mouseDownTimer.value);
        }

        mouseDownTimer.value = window.setTimeout(() => {
            isDragging.value = true;
            draggedItem.value = item;
            dragSourceIndex.value = index;
        }, DRAG_DELAY) as unknown as number;

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
        if (mouseDownTimer.value !== null) {
            const dx = event.clientX - mouseDownPos.value.x;
            const dy = event.clientY - mouseDownPos.value.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {
                clearTimeout(mouseDownTimer.value);
                mouseDownTimer.value = null;
            }
        }

        if (isDragging.value) {
            cursorPos.value = { x: event.clientX, y: event.clientY };
        }
    };

    const handleGlobalMouseUp = () => {
        cleanupDragState();
    };

    const handleMouseEnter = (index: number) => {
        currentHoverIndex.value = index;
    };

    const handleMouseLeave = (index: number) => {
        if (currentHoverIndex.value === index) {
            currentHoverIndex.value = null;
        }
    };

    const isDraggingFromIndex = (index: number): boolean => {
        return isDragging.value && dragSourceIndex.value === index;
    };

    const isHoveringIndex = (index: number): boolean => {
        return currentHoverIndex.value === index;
    };

    onUnmounted(() => {
        cleanupDragState();
    });

    return {
        isDragging,
        draggedItem,
        dragSourceIndex,
        cursorPos,
        currentHoverIndex,
        handleMouseDown,
        handleMouseEnter,
        handleMouseLeave,
        cleanupDragState,
        isDraggingFromIndex,
        isHoveringIndex,
    };
}
