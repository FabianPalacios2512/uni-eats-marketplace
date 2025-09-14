package com.remington.unieats.marketplace.dto;

import com.remington.unieats.marketplace.model.enums.DiaSemana;

public class HorarioUpdateDTO {
    
    private DiaSemana dia;
    private String horaApertura; // Recibimos como String (ej: "08:00")
    private String horaCierre;
    private boolean abierto;

    // Getters y Setters
    public DiaSemana getDia() { return dia; }
    public void setDia(DiaSemana dia) { this.dia = dia; }
    public String getHoraApertura() { return horaApertura; }
    public void setHoraApertura(String horaApertura) { this.horaApertura = horaApertura; }
    public String getHoraCierre() { return horaCierre; }
    public void setHoraCierre(String horaCierre) { this.horaCierre = horaCierre; }
    public boolean isAbierto() { return abierto; }
    public void setAbierto(boolean abierto) { this.abierto = abierto; }
}