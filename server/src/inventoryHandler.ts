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
        alt.logWarning(`Trying to stack ${uidToStack} on ${uidToStackOn} ...`);

        const playerItemManager = ItemManager.usePlayerItemManager(player);
        const isStacked = await playerItemManager.stack(uidToStackOn, uidToStack);

        if (isStacked) {
            updateInventoryWebview(player);
        }
    },
);

alt.onClient(InventoryEvents.Server.Inventory_SplitItems, async (player: alt.Player, uid: string, quantity: number) => {
    const playerItemManager = ItemManager.usePlayerItemManager(player);
    const didSplit = await playerItemManager.split(uid, quantity);

    if (didSplit) {
        updateInventoryWebview(player);
    }
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
        playRandomSound(player);
    } catch (error) {
        const rPlayer = Rebar.document.character.useCharacter(player);

        console.error(`Error handling weapon ${item.id}:`, error);
        const weaponHash = alt.hash(item.id);
        await Rebar.player.useWeapon(player).clearWeapon(weaponHash);
        rPlayer.set('weapons', []);
    }
});

function playRandomSound(player: alt.Player) {
    const sounds = [
        'all_gonna_die_02.ogg',
        'do_you_really_think_022.ogg',
        'dust_to_dust_018.ogg',
        'forward_the_purification_015.ogg',
        'fuck_you_01.ogg',
        'fucking_worthless_010.ogg',
        'guardian_angel_011.ogg',
        'killing_time_029.ogg',
        'lambs_to_the_slaughter_09.ogg',
        'lowest_common_denominator_024.ogg',
        'man_of_hate_013.ogg',
        'natural_death_012.ogg',
        'nightmare_06.ogg',
        'no_more_useless_words_026.ogg',
        'pathetic_017.ogg',
        'postal_quote_05.ogg',
        'preys_destiny_016.ogg',
        'quiet_028.ogg',
        'sometimes_021.ogg',
        'stfu_and_die_027.ogg',
        'suffer_and_die_07.ogg',
        'thats_cute_025.ogg',
        'thats_the_spirit_020.ogg',
        'this_is_more_08.ogg',
        'time_to_die_030.ogg',
        'try_harder_023.ogg',
        'who_cares_03.ogg',
        'you_reek_of_weakness_019.ogg',
        'your_family_04.ogg',
    ];

    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    Rebar.player.useAudio(player).playSound(`../../sounds/${randomSound}`);
}

export function updateInventoryWebview(player: alt.Player) {
    const rebarDocument = Rebar.document.character.useCharacter(player).get();
    const Webview = useWebview(player);

    const inventoryWithEmptySlots = new Array(InventoryConfig.itemManager.slots.maxSlots).fill(null);

    rebarDocument.items.forEach((item, index) => {
        if (index < inventoryWithEmptySlots.length) {
            inventoryWithEmptySlots[index] = item;
        }
    });

    Webview.emit(InventoryEvents.Webview.Inventory_UpdateItems, inventoryWithEmptySlots);
}
