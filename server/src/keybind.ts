import { useRebar } from '@Server/index.js';
import { useWebview } from '@Server/player/webview.js';
import { useKeybinder } from '@Server/systems/serverKeybinds.js';
import * as alt from 'alt-server';

const Rebar = useRebar();
const Keybinder = useKeybinder();

Keybinder.on('O'.charCodeAt(0), (player: alt.Player) => {
    const Webview = useWebview(player);

    Webview.show('Inventory', 'page', true);
    Webview.focus();

    Rebar.player.useWorld(player).disableControls();
});

alt.on('rebar:playerPageClosed', (player: alt.Player, page) => {
    if (page === 'Inventory') {
        Rebar.player.useWorld(player).enableControls();
    }
});
