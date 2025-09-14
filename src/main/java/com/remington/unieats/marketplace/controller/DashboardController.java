package com.remington.unieats.marketplace.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @GetMapping("/admin")
    public String mostrarDashboardAdmin() {
        return "admin/admin_dashboard"; // Apunta a admin_dashboard.html en la carpeta admin
    }

    @GetMapping("/vendedor")
    public String mostrarDashboardVendedor() {
        // Esta línea asegura que se sirva el archivo vendedor_dashboard.html
        return "vendedor_dashboard"; 
    }

    @GetMapping("/estudiante")
    public String mostrarDashboardEstudiante() {
        return "estudiante_dashboard";
    }
}