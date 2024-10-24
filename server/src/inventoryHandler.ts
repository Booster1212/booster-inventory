import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useWebview } from '@Server/player/webview.js';
import { Item } from '@Shared/types/items.js';
import { useApi } from '@Server/api/index.js';
import { InventoryEvents } from '../../shared/events.js';

const Rebar = useRebar();
const ItemManager = await useApi().getAsync('item-manager-api');

alt.onRpc(InventoryEvents.Server.Inventory_RequestItems, (player: alt.Player) => {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    return rebarDocument.items;
});

alt.onClient(InventoryEvents.Server.Inventory_UseItem, (player: alt.Player, item: Item) => {
    ItemManager.usePlayerItemManager(player).use(item.uid);
});

alt.on('inventory:useWeapon', async (player: alt.Player, item: Item) => {
    try {
        const rPlayer = Rebar.document.character.useCharacter(player);
        const playerData = rPlayer.get();
        const playerWeapons = playerData.weapons || [];

        const weaponHash = alt.hash(item.id);
        const hasWeapon = playerWeapons.some((w) => w.hash === weaponHash);

        if (hasWeapon) {
            await Rebar.player.useWeapon(player).clearWeapon(weaponHash);

            const updatedWeapons = playerWeapons.filter((w) => w.hash !== weaponHash);
            rPlayer.set('weapons', updatedWeapons);

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

        // Rebar.player.useAudio(player).playSound('../../sounds/killing_time_029.ogg');
    } catch (error) {
        const rPlayer = Rebar.document.character.useCharacter(player);

        console.error(`Error handling weapon ${item.id}:`, error);
        const weaponHash = alt.hash(item.id);
        await Rebar.player.useWeapon(player).clearWeapon(weaponHash);
        rPlayer.set('weapons', []);
    }
});

export function updateInventoryWebview(player: alt.Player) {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    const Webview = useWebview(player);
    Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, rebarDocument.items);
}
