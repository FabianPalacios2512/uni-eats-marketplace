package com.remington.unieats.marketplace.model.enums;

public enum EstadoTienda {
    PENDIENTE, // La tienda fue creada por un vendedor y espera aprobación del admin
    ACTIVA,    // La tienda fue aprobada y está visible para los clientes
    INACTIVA   // La tienda fue deshabilitada por el admin o el vendedor
}