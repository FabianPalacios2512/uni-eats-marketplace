package com.remington.unieats.marketplace.dto;

public class DashboardStatsDTO {
    private long totalUsuarios;
    private long totalEstudiantes;
    private long totalVendedores;
    private long totalTiendas; // Placeholder para el futuro

    // Getters y Setters
    public long getTotalUsuarios() { return totalUsuarios; }
    public void setTotalUsuarios(long totalUsuarios) { this.totalUsuarios = totalUsuarios; }
    public long getTotalEstudiantes() { return totalEstudiantes; }
    public void setTotalEstudiantes(long totalEstudiantes) { this.totalEstudiantes = totalEstudiantes; }
    public long getTotalVendedores() { return totalVendedores; }
    public void setTotalVendedores(long totalVendedores) { this.totalVendedores = totalVendedores; }
    public long getTotalTiendas() { return totalTiendas; }
    public void setTotalTiendas(long totalTiendas) { this.totalTiendas = totalTiendas; }
}
