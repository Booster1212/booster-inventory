import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useWebview } from '@Server/player/webview.js';
import { Item } from '@Shared/types/items.js';
import { useApi } from '@Server/api/index.js';
import { InventoryEvents } from '../../shared/events.js';
import { InventoryConfig } from '../../shared/config.js';

const Rebar = useRebar();
const ItemManager = await useApi().getAsync('item-manager-api');

alt.onRpc(InventoryEvents.Server.Inventory_RequestItems, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.items;
});

alt.onClient(InventoryEvents.Server.Inventory_UseItem, (player: alt.Player, item: Item) => {
    ItemManager.usePlayerItemManager(player).use(item.uid);
});

alt.onClient(
    InventoryEvents.Server.Inventory_StackItems,
    async (player: alt.Player, uidToStackOn: string, uidToStack: string) => {
        try {
            const rebarDocument = Rebar.document.character.useCharacter(player);
            let inventory = [...rebarDocument.get().items];

            console.log('Before stacking:', {
                inventorySize: inventory.length,
                items: inventory.map((i) => ({ uid: i.uid, quantity: i.quantity })),
            });

            const targetItemIndex = inventory.findIndex((item) => item.uid === uidToStackOn);
            const sourceItemIndex = inventory.findIndex((item) => item.uid === uidToStack);

            if (targetItemIndex === -1 || sourceItemIndex === -1) {
                console.log('Items not found:', { uidToStackOn, uidToStack });
                return;
            }

            const targetItem = { ...inventory[targetItemIndex] };
            const sourceItem = { ...inventory[sourceItemIndex] };

            if (targetItem.id !== sourceItem.id) {
                console.log('Items cannot be stacked - different types');
                return;
            }

            const availableSpace = targetItem.maxStack - targetItem.quantity;
            if (availableSpace <= 0) {
                console.log('Target stack is full');
                return;
            }

            const amountToStack = Math.min(availableSpace, sourceItem.quantity);

            let newInventory = inventory.map((item) => ({ ...item }));

            newInventory[targetItemIndex] = {
                ...targetItem,
                quantity: targetItem.quantity + amountToStack,
            };

            if (sourceItem.quantity - amountToStack <= 0) {
                newInventory = newInventory.filter((_, index) => index !== sourceItemIndex);
            } else {
                newInventory[sourceItemIndex] = {
                    ...sourceItem,
                    quantity: sourceItem.quantity - amountToStack,
                };
            }

            const oldTotal = inventory.reduce((sum, item) => sum + item.quantity, 0);
            const newTotal = newInventory.reduce((sum, item) => sum + item.quantity, 0);

            if (oldTotal !== newTotal) {
                console.error('Quantity mismatch after stacking:', { oldTotal, newTotal });
                return;
            }

            rebarDocument.set('items', newInventory);
            updateInventoryWebview(player);

            console.log('After stacking:', {
                inventorySize: newInventory.length,
                items: newInventory.map((i) => ({ uid: i.uid, quantity: i.quantity })),
            });
        } catch (error) {
            console.error('Stack items error:', error);
        }
    },
);

alt.onClient(InventoryEvents.Server.Inventory_SplitItems, async (player: alt.Player, uid: string, quantity: number) => {
    try {
        const rebarDocument = Rebar.document.character.useCharacter(player);
        let inventory = [...rebarDocument.get().items];

        console.log('Before splitting:', {
            inventorySize: inventory.length,
            totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
        });

        const sourceItemIndex = inventory.findIndex((item) => item.uid === uid);
        if (sourceItemIndex === -1) {
            console.log('Source item not found:', uid);
            return;
        }

        const sourceItem = inventory[sourceItemIndex];

        if (quantity <= 0 || quantity >= sourceItem.quantity) {
            console.log('Invalid split quantity:', quantity);
            return;
        }

        const newItem = {
            ...sourceItem,
            uid: `${sourceItem.uid}_split_${Date.now()}`,
            quantity: quantity,
        };

        let newInventory = inventory.map((item) => ({ ...item }));

        newInventory[sourceItemIndex] = {
            ...sourceItem,
            quantity: sourceItem.quantity - quantity,
        };

        newInventory.push(newItem);

        const oldTotal = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const newTotal = newInventory.reduce((sum, item) => sum + item.quantity, 0);
        const oldWeight = inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
        const newWeight = newInventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);

        if (oldTotal !== newTotal || oldWeight !== newWeight) {
            console.error('Quantity/Weight mismatch after splitting:', {
                quantities: { oldTotal, newTotal },
                weights: { oldWeight, newWeight },
            });
            return;
        }

        rebarDocument.set('items', newInventory);
        updateInventoryWebview(player);

        console.log('After splitting:', {
            inventorySize: newInventory.length,
            totalItems: newInventory.reduce((sum, item) => sum + item.quantity, 0),
        });
    } catch (error) {
        console.error('Split items error:', error);
    }
});

alt.on('inventory:useWeapon', async (player: alt.Player, item: Item) => {
    try {
        const rPlayer = Rebar.document.character.useCharacter(player);
        const playerData = rPlayer.get();
        const playerWeapons = playerData.weapons || [];
        const weaponHash = alt.hash(item.id);

        if (playerWeapons.some((w) => w.hash === weaponHash)) {
            await Rebar.player.useWeapon(player).clearWeapon(weaponHash);
            rPlayer.set(
                'weapons',
                playerWeapons.filter((w) => w.hash !== weaponHash),
            );
            await Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'outro', 47, 2000, false);
            return;
        }

        for (const weapon of playerWeapons) {
            await Rebar.player.useWeapon(player).clearWeapon(weapon.hash);
        }

        await Rebar.player.useWeapon(player).add(item.id, 50);
        rPlayer.set('weapons', [
            {
                hash: weaponHash,
                ammo: 50,
                tintIndex: 0,
                components: [],
            },
        ]);

        await Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'intro', 47, 2250, false);
        playRandomSound(player);
    } catch (error) {
        console.error(`Error handling weapon ${item.id}:`, error);
        const rPlayer = Rebar.document.character.useCharacter(player);
        await Rebar.player.useWeapon(player).clearWeapon(alt.hash(item.id));
        rPlayer.set('weapons', []);
    }
});

function playRandomSound(player: alt.Player) {
    const sounds = [
        'all_gonna_die_02.ogg',
        'dust_to_dust_018.ogg',
        'fucking_worthless_010.ogg',
        'nightmare_06.ogg',
        'pathetic_017.ogg',
        'suffer_and_die_07.ogg',
        'time_to_die_030.ogg',
        'try_harder_023.ogg',
    ];

    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    Rebar.player.useAudio(player).playSound(`../../sounds/${randomSound}`);
}

export function updateInventoryWebview(player: alt.Player) {
    try {
        const rebarDocument = Rebar.document.character.useCharacter(player).get();
        const Webview = useWebview(player);

        const inventoryWithEmptySlots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);

        const items = rebarDocument.items.map((item) => ({ ...item }));

        items.forEach((item, index) => {
            if (index < inventoryWithEmptySlots.length) {
                inventoryWithEmptySlots[index] = item;
            }
        });

        Webview.emit(InventoryEvents.Webview.Inventory_UpdateToolbar, inventoryWithEmptySlots);

        setTimeout(() => {
            Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);
        }, 50);

        console.log('[Inventory Update]', {
            totalItems: items.length,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        });
    } catch (error) {
        console.error('Error updating inventory webview:', error);
    }
}
