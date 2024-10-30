import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Item } from '@Shared/types/items.js';
import { InventoryEvents } from '../../shared/events.js';
import { useApi } from '@Server/api/index.js';

const Rebar = useRebar();

declare module '@Shared/types/Character.js' {
    export interface Character {
        lastWeapon?: {
            hash: number;
            ammo: number;
            tintIndex: number;
            components: any[];
        };
    }
}

alt.onClient(InventoryEvents.Server.Inventory_UseItem, async (player: alt.Player, item: Item) => {
    const ItemManager = await useApi().getAsync('item-manager-api');
    const dbItem = ItemManager.useItemManager().getDatabaseItem(item.id);
    const used = await ItemManager.usePlayerItemManager(player).use(item.uid);
    alt.logWarning(`Using Item ${item.name} | event: ${item.useEventName} | UID: ${item.uid} | Used: ${used}`);
});

alt.on('inventory:useWeapon', async (player: alt.Player, item: Item) => {
    try {
        const rPlayer = Rebar.document.character.useCharacter(player);
        const playerData = rPlayer.get();
        let playerWeapons = playerData.weapons || [];
        const weaponHash = alt.hash(item.id.toString());

        if (playerWeapons.some((w) => w.hash === weaponHash)) {
            await Rebar.player.useWeapon(player).clearWeapon(weaponHash);
            rPlayer.set(
                'weapons',
                playerWeapons.filter((w) => w.hash !== weaponHash),
            );
            rPlayer.set('lastWeapon', null);
            await Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'outro', 47, 2000, false);
            return;
        }

        for (const weapon of playerWeapons) {
            await Rebar.player.useWeapon(player).clearWeapon(weapon.hash);
        }

        playerWeapons = [];
        rPlayer.set('weapons', playerWeapons);

        await Rebar.player.useWeapon(player).add(item.id, 50);
        const lastWeapon = {
            hash: weaponHash,
            ammo: 50,
            tintIndex: 0,
            components: [],
        };
        rPlayer.set('lastWeapon', lastWeapon);
        playerWeapons.push(lastWeapon);
        rPlayer.set('weapons', playerWeapons);

        await Rebar.usePlayer(player).animation.playFinite('reaction@intimidation@1h', 'intro', 47, 2250, false);
    } catch (error) {
        console.error(`Error handling weapon ${item.id}:`, error);

        const rPlayer = Rebar.document.character.useCharacter(player);
        await Rebar.player.useWeapon(player).clearWeapon(alt.hash(item.id.toString()));
        rPlayer.set('weapons', []);
        rPlayer.set('lastWeapon', null);
    }
});

alt.on('rebar:playerCharacterBound', async (player: alt.Player) => {
    try {
        const rPlayer = Rebar.document.character.useCharacter(player);
        const lastWeapon = rPlayer.get().lastWeapon;

        if (lastWeapon) {
            await Rebar.player.useWeapon(player).add(lastWeapon.hash, lastWeapon.ammo);
            rPlayer.set('weapons', [lastWeapon]);
        } else {
            rPlayer.set('lastWeapon', null);
            rPlayer.set('weapons', []);
        }
    } catch (error) {
        console.error(`Error rebinding player weapon:`, error);
    }
});
