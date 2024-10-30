import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Item } from '@Shared/types/items.js';
import { InventoryEvents } from '../../../shared/events.js';
import { useWebview } from '@Server/player/webview.js';
import { EquipmentSlot, DEFAULT_EQUIPMENT_SLOTS } from '../../../shared/types.js';

const Rebar = useRebar();

export interface EquipmentOperationResult {
    success: boolean;
    equipment: Array<EquipmentSlot>;
    error?: string;
}

class EquipmentService {
    private async updatePlayerEquipment(
        player: alt.Player,
        equipment: Array<EquipmentSlot>,
        emitUpdate: boolean = true,
    ): Promise<boolean> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            rebarDocument.set('equipment', equipment);

            if (emitUpdate) {
                const Webview = useWebview(player);
                Webview.emit(InventoryEvents.Webview.Inventory_UpdateEquipment, equipment);
            }

            return true;
        } catch (error) {
            console.error('Error updating player equipment:', error);
            return false;
        }
    }

    public async handleEquipItem(player: alt.Player, item: Item, slotId: string): Promise<EquipmentOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentEquipment = [...(rebarDocument.get().equipment || DEFAULT_EQUIPMENT_SLOTS)];
            const currentInventory = [...(rebarDocument.get().items || [])];

            const slotIndex = currentEquipment.findIndex((slot) => slot.id === slotId);
            if (slotIndex === -1) {
                return { success: false, equipment: currentEquipment, error: 'Invalid slot' };
            }

            const slot = currentEquipment[slotIndex];
            if (slot.allowedTypes && !slot.allowedTypes.includes(item.data.type as string)) {
                return { success: false, equipment: currentEquipment, error: 'Invalid item type for slot' };
            }

            const itemIndex = currentInventory.findIndex((invItem) => invItem.uid === item.uid);
            if (itemIndex === -1) {
                return { success: false, equipment: currentEquipment, error: 'Item not found in inventory' };
            }

            const newInventory = currentInventory.filter((invItem) => invItem.uid !== item.uid);
            const existingItem = slot.item;
            if (existingItem) {
                newInventory.push(existingItem);
            }

            const newEquipment = [...currentEquipment];
            newEquipment[slotIndex] = { ...slot, item };

            rebarDocument.set('items', newInventory);
            await this.updatePlayerEquipment(player, newEquipment);

            return { success: true, equipment: newEquipment };
        } catch (error) {
            console.error('Equip item error:', error);
            return { success: false, equipment: [], error: 'Internal error' };
        }
    }

    public async handleUnequipItem(player: alt.Player, slotId: string): Promise<EquipmentOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentEquipment = [...(rebarDocument.get().equipment || DEFAULT_EQUIPMENT_SLOTS)];
            const currentInventory = [...(rebarDocument.get().items || [])];

            const slotIndex = currentEquipment.findIndex((slot) => slot.id === slotId);
            if (slotIndex === -1) {
                return { success: false, equipment: currentEquipment, error: 'Invalid slot' };
            }

            const slot = currentEquipment[slotIndex];
            if (!slot.item) {
                return { success: false, equipment: currentEquipment, error: 'No item in slot' };
            }

            const newEquipment = [...currentEquipment];
            const unequippedItem = slot.item;
            newEquipment[slotIndex] = { ...slot, item: null };

            const newInventory = [...currentInventory, unequippedItem];
            rebarDocument.set('items', newInventory);
            await this.updatePlayerEquipment(player, newEquipment);

            return { success: true, equipment: newEquipment };
        } catch (error) {
            console.error('Unequip item error:', error);
            return { success: false, equipment: [], error: 'Internal error' };
        }
    }

    public async handleSwapEquipment(
        player: alt.Player,
        fromSlotId: string,
        toSlotId: string,
    ): Promise<EquipmentOperationResult> {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            const currentEquipment = [...(rebarDocument.get().equipment || DEFAULT_EQUIPMENT_SLOTS)];

            const fromSlotIndex = currentEquipment.findIndex((slot) => slot.id === fromSlotId);
            const toSlotIndex = currentEquipment.findIndex((slot) => slot.id === toSlotId);

            if (fromSlotIndex === -1 || toSlotIndex === -1) {
                return { success: false, equipment: currentEquipment, error: 'Invalid slot' };
            }

            const fromSlot = currentEquipment[fromSlotIndex];
            const toSlot = currentEquipment[toSlotIndex];

            if (!fromSlot.item && !toSlot.item) {
                return { success: false, equipment: currentEquipment, error: 'No items to swap' };
            }

            if (
                fromSlot.item &&
                toSlot.allowedTypes &&
                !toSlot.allowedTypes.includes(fromSlot.item.data.type as string)
            ) {
                return { success: false, equipment: currentEquipment, error: 'Invalid item type for target slot' };
            }

            if (
                toSlot.item &&
                fromSlot.allowedTypes &&
                !fromSlot.allowedTypes.includes(toSlot.item.data.type as string)
            ) {
                return { success: false, equipment: currentEquipment, error: 'Invalid item type for source slot' };
            }

            const newEquipment = [...currentEquipment];
            [newEquipment[fromSlotIndex].item, newEquipment[toSlotIndex].item] = [
                newEquipment[toSlotIndex].item,
                newEquipment[fromSlotIndex].item,
            ];

            await this.updatePlayerEquipment(player, newEquipment);
            return { success: true, equipment: newEquipment };
        } catch (error) {
            console.error('Swap equipment error:', error);
            return { success: false, equipment: [], error: 'Internal error' };
        }
    }

    public async initializePlayerEquipment(player: alt.Player): Promise<void> {
        const rebarDocument = Rebar.document.character.useCharacter(player);
        const characterData = rebarDocument.get();

        if (!characterData.equipment) {
            await this.updatePlayerEquipment(player, DEFAULT_EQUIPMENT_SLOTS, true);
        }
    }

    public calculateTotalArmorRating(equipment: Array<EquipmentSlot>): number {
        return equipment.reduce((total, slot) => {
            if (slot.item?.data?.armorRating) {
                return total + slot.item.data.armorRating;
            }
            return total;
        }, 0);
    }

    public calculateTotalEquipmentWeight(equipment: Array<EquipmentSlot>): number {
        return equipment.reduce((total, slot) => {
            if (slot.item?.weight) {
                return total + slot.item.weight;
            }
            return total;
        }, 0);
    }
}

export const equipmentService = new EquipmentService();
