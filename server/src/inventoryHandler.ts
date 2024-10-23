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

alt.on('inventory:usePistol', (player: alt.Player, item: Item) => {
    handleWeaponTest(player, item);
});

export async function handleWeaponTest(player: alt.Player, item: Item) {
    const rPlayer = Rebar.document.character.useCharacter(player);
    const playerWeapons = rPlayer.get().weapons;

    if (playerWeapons && rPlayer.get().weapons.find((x) => x.hash === alt.hash(item.id))) {
        Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'outro', 47, 2000, false);
        Rebar.player.useWeapon(player).clearWeapon(item.id);
        return;
    }

    Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'intro', 47, 2250, false);
    await Rebar.player.useWeapon(player).add(item.id, 50);
}

export function updateInventoryWebview(player: alt.Player) {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    const Webview = useWebview(player);

    Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, rebarDocument.items);
}
