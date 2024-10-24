export const InventoryConfig = {
    itemManager: {
        weight: {
            enabled: true,
            maxWeight: 250.0, // Maximum weight a player can carry
        },
        slots: {
            enabled: true,
            maxSlots: 64, // Maximum number of slots
        },
    },
    overweightDebuff: {
        enabled: true,
        movementPenalty: 0.7, // 70% normal speed when overweight
    },
};
