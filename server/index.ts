import './src/keybind.js';
import './src/itemHandler.js';

import './src/services/InventoryService.js';
import './src/services/ToolbarService.js';
import './src/services/EquipmentService.js';
import './src/services/ItemValidationService.js';

import './src/inventoryHandler.js';

import './src/items/weapons.js';
import './src/items/food.js';
import './src/commands.js';
import './src/api.js';

import { useServerConfig } from '@Server/systems/serverConfig.js';

const ServerCfg = useServerConfig();

ServerCfg.set('disableWeaponRadial', true);
