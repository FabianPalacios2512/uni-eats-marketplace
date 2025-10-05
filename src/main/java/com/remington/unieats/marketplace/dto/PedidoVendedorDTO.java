package com.remington.unieats.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PedidoVendedorDTO {

    private Integer id;
    private LocalDateTime fechaCreacion;
    private String estado;
    private BigDecimal total;
    private String nombreComprador;
    private List<DetallePedidoVendedorDTO> detalles;
    
    // Nuevos campos para información de entrega y pago
    private String tipoEntrega; // 'domicilio' o 'recoger'
    private String tipoPago; // 'efectivo' o 'transferencia'
    private String notasGenerales;
    private String notasDomicilio;

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getNombreComprador() { return nombreComprador; }
    public void setNombreComprador(String nombreComprador) { this.nombreComprador = nombreComprador; }
    public List<DetallePedidoVendedorDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedidoVendedorDTO> detalles) { this.detalles = detalles; }

    // Getters y Setters para información de entrega y pago
    public String getTipoEntrega() { return tipoEntrega; }
    public void setTipoEntrega(String tipoEntrega) { this.tipoEntrega = tipoEntrega; }
    public String getTipoPago() { return tipoPago; }
    public void setTipoPago(String tipoPago) { this.tipoPago = tipoPago; }
    public String getNotasGenerales() { return notasGenerales; }
    public void setNotasGenerales(String notasGenerales) { this.notasGenerales = notasGenerales; }
    public String getNotasDomicilio() { return notasDomicilio; }
    public void setNotasDomicilio(String notasDomicilio) { this.notasDomicilio = notasDomicilio; }

    // Clase interna para los detalles
    public static class DetallePedidoVendedorDTO {
        private String nombreProducto;
        private int cantidad;
        private BigDecimal precioUnitario;
        private String opcionesSeleccionadas; // Lista de opciones como texto

        // Getters y Setters
        public String getNombreProducto() { return nombreProducto; }
        public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }
        public int getCantidad() { return cantidad; }
        public void setCantidad(int cantidad) { this.cantidad = cantidad; }
        public BigDecimal getPrecioUnitario() { return precioUnitario; }
        public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
        public String getOpcionesSeleccionadas() { return opcionesSeleccionadas; }
        public void setOpcionesSeleccionadas(String opcionesSeleccionadas) { this.opcionesSeleccionadas = opcionesSeleccionadas; }
    }
}