import './src/keybind.js';
import './src/inventoryHandler.js';

import './src/items/weapons.js';
import './src/items/food.js';
import './src/commands.js';
import { useServerConfig } from '@Server/systems/serverConfig.js';

const ServerCfg = useServerConfig();

ServerCfg.set('disableWeaponRadial', true);
