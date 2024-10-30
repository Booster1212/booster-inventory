import { ref, computed } from 'vue';
import { useItemValidation } from './useItemValidation.js';
import { Item } from '@Shared/types/items.js';

export type DragSource = 'inventory' | 'toolbar';

interface DragState {
    isDragging: boolean;
    draggedItem: Item | null;
    sourceIndex: number | null;
    sourceType: DragSource | null;
    startPosition: { x: number; y: number };
    currentPosition: { x: number; y: number };
    dragTimer: number | null;
    isMouseDown: boolean;
    dragStartTime: number;
}

export function useDragAndDrop() {
    const { isValidItem } = useItemValidation();
    const DRAG_DELAY = 150;
    const CLICK_THRESHOLD = 25;
    const DRAG_TIME_THRESHOLD = 200;

    const dragState = ref<DragState>({
        isDragging: false,
        draggedItem: null,
        sourceIndex: null,
        sourceType: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        dragTimer: null,
        isMouseDown: false,
        dragStartTime: 0,
    });

    let preservedState = {
        draggedItem: null as Item | null,
        sourceIndex: null as number | null,
        sourceType: null as DragSource | null,
    };

    let ghostElement: HTMLElement | null = null;
    let dragStartDistance = 0;

    const handleMouseDown = (event: MouseEvent, index: number, item: Item, sourceType: DragSource) => {
        if (!isValidItem(item) || event.button !== 0) return;

        dragStartDistance = 0;
        dragState.value = {
            isDragging: false,
            isMouseDown: true,
            startPosition: { x: event.clientX, y: event.clientY },
            currentPosition: { x: event.clientX, y: event.clientY },
            draggedItem: item,
            sourceIndex: index,
            sourceType,
            dragStartTime: Date.now(),
            dragTimer: window.setTimeout(() => {
                if (dragState.value.isMouseDown && dragStartDistance < CLICK_THRESHOLD) {
                    startDrag();
                }
            }, DRAG_DELAY) as unknown as number,
        };

        preservedState = {
            draggedItem: item,
            sourceIndex: index,
            sourceType,
        };

        document.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!dragState.value.isMouseDown) return;

        const dx = event.clientX - dragState.value.startPosition.x;
        const dy = event.clientY - dragState.value.startPosition.y;
        dragStartDistance = Math.sqrt(dx * dx + dy * dy);

        if (dragStartDistance > CLICK_THRESHOLD && !dragState.value.isDragging && dragState.value.dragTimer) {
            window.clearTimeout(dragState.value.dragTimer);
            dragState.value.dragTimer = null;
            startDrag();
        }

        if (dragState.value.isDragging && ghostElement) {
            ghostElement.style.left = `${event.clientX}px`;
            ghostElement.style.top = `${event.clientY}px`;
            dragState.value.currentPosition = { x: event.clientX, y: event.clientY };
            document.body.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = (event: MouseEvent, targetIndex: number, targetType: DragSource) => {
        const wasClick =
            !dragState.value.isDragging && Date.now() - dragState.value.dragStartTime < DRAG_TIME_THRESHOLD;

        const result = {
            wasClick,
            sourceIndex: preservedState.sourceIndex,
            sourceType: preservedState.sourceType,
            targetIndex,
            targetType,
            item: preservedState.draggedItem,
            _debug: {
                dragDistance: calculateDistance(event),
                dragTime: Date.now() - dragState.value.dragStartTime,
                thresholds: {
                    distance: CLICK_THRESHOLD,
                    time: DRAG_TIME_THRESHOLD,
                },
            },
        };

        cleanup();
        return result;
    };

    const handleGlobalMouseUp = (event: MouseEvent) => {
        document.body.style.cursor = '';
        cleanup();
    };

    const startDrag = () => {
        if (!dragState.value.draggedItem) return;
        dragState.value.isDragging = true;
        createGhostElement(dragState.value.draggedItem);
        document.body.style.cursor = 'grabbing';
    };

    const createGhostElement = (item: Item) => {
        if (ghostElement) {
            ghostElement.parentNode?.removeChild(ghostElement);
        }

        ghostElement = document.createElement('div');
        ghostElement.className = 'fixed pointer-events-none z-50';
        ghostElement.style.cssText = `
            width: 72px;
            height: 72px;
            position: fixed;
            left: ${dragState.value.startPosition.x}px;
            top: ${dragState.value.startPosition.y}px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            will-change: transform;
            transition: transform 0.1s ease;
            background: none;
        `;

        ghostElement.innerHTML = `
            <div class="relative h-full w-full overflow-hidden rounded-lg border border-blue-500/50 bg-none">
                <img 
                    src="${item.icon}" 
                    alt="${item.name}" 
                    class="h-full w-full object-cover"
                    draggable="false"
                />
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-2">
                    <div class="truncate text-xs font-medium text-gray-300">${item.name}</div>
                </div>
                ${
                    item.quantity > 1
                        ? `<div class="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-gray-300">
                        ${item.quantity}x
                       </div>`
                        : ''
                }
            </div>
        `;

        document.body.appendChild(ghostElement);
    };

    const calculateDistance = (event: MouseEvent) => {
        const dx = event.clientX - dragState.value.startPosition.x;
        const dy = event.clientY - dragState.value.startPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const cleanup = () => {
        if (dragState.value.dragTimer) {
            window.clearTimeout(dragState.value.dragTimer);
        }

        if (ghostElement && ghostElement.parentNode) {
            ghostElement.parentNode.removeChild(ghostElement);
            ghostElement = null;
        }

        dragState.value = {
            isDragging: false,
            draggedItem: null,
            sourceIndex: null,
            sourceType: null,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            dragTimer: null,
            isMouseDown: false,
            dragStartTime: 0,
        };

        document.body.style.cursor = '';
    };

    const isDraggingFromIndex = (index: number, type: DragSource): boolean => {
        return (
            dragState.value.isDragging && dragState.value.sourceIndex === index && dragState.value.sourceType === type
        );
    };

    return {
        isDragging: computed(() => dragState.value.isDragging),
        draggedItem: computed(() => dragState.value.draggedItem),
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        isDraggingFromIndex,
        cleanup,
    };
}
