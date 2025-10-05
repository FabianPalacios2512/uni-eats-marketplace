package com.remington.unieats.marketplace.dto;

import java.util.List;

public class PedidoDTO {

    private Integer tiendaId;
    private List<ItemPedidoDTO> items;
    
    // 🚛 Campos para entrega y pago
    private String tipoEntrega; // 'domicilio' o 'recoger'
    private String tipoPago; // 'efectivo' o 'transferencia'
    private String notasGenerales;
    private String notasDomicilio;

    // Getters y Setters
    public Integer getTiendaId() {
        return tiendaId;
    }
    public void setTiendaId(Integer tiendaId) {
        this.tiendaId = tiendaId;
    }
    public List<ItemPedidoDTO> getItems() {
        return items;
    }
    public void setItems(List<ItemPedidoDTO> items) {
        this.items = items;
    }

    // 🚛 Getters y Setters para entrega y pago
    public String getTipoEntrega() {
        return tipoEntrega;
    }
    public void setTipoEntrega(String tipoEntrega) {
        this.tipoEntrega = tipoEntrega;
    }
    public String getTipoPago() {
        return tipoPago;
    }
    public void setTipoPago(String tipoPago) {
        this.tipoPago = tipoPago;
    }
    public String getNotasGenerales() {
        return notasGenerales;
    }
    public void setNotasGenerales(String notasGenerales) {
        this.notasGenerales = notasGenerales;
    }
    public String getNotasDomicilio() {
        return notasDomicilio;
    }
    public void setNotasDomicilio(String notasDomicilio) {
        this.notasDomicilio = notasDomicilio;
    }

    // Clase interna para representar cada item del carrito
    public static class ItemPedidoDTO {
        private Integer id; // ID del producto base
        private int cantidad;
        private List<Integer> opcionesIds; // <-- CAMPO NUEVO Y CLAVE

        // Getters y Setters
        public Integer getId() {
            return id;
        }
        public void setId(Integer id) {
            this.id = id;
        }
        public int getCantidad() {
            return cantidad;
        }
        public void setCantidad(int cantidad) {
            this.cantidad = cantidad;
        }
        public List<Integer> getOpcionesIds() { // <-- GETTER Y SETTER NUEVOS
            return opcionesIds;
        }
        public void setOpcionesIds(List<Integer> opcionesIds) {
            this.opcionesIds = opcionesIds;
        }
    }
}