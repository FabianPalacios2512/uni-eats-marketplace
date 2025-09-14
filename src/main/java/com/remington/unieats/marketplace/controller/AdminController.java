package com.remington.unieats.marketplace.controller;

import com.remington.unieats.marketplace.dto.TiendaDetallesDTO;
import com.remington.unieats.marketplace.dto.UsuarioAdminDTO;
import com.remington.unieats.marketplace.model.entity.Rol;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.EstadoTienda;
import com.remington.unieats.marketplace.model.repository.RolRepository;
import com.remington.unieats.marketplace.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired private AdminService adminService;
    @Autowired private RolRepository rolRepository;
    
    @GetMapping("/dashboard")
    public String mostrarDashboard(Model model) {
        model.addAttribute("stats", adminService.getDashboardStats());
        model.addAttribute("usuarios", adminService.listarTodosLosUsuarios());
        model.addAttribute("todosLosRoles", rolRepository.findAll());

        if (!model.containsAttribute("usuarioDto")) {
            model.addAttribute("usuarioDto", new UsuarioAdminDTO());
        }
        
        List<Tienda> todasLasTiendas = adminService.listarTodasLasTiendas();
        Map<EstadoTienda, List<Tienda>> tiendasPorEstado = todasLasTiendas.stream()
            .collect(Collectors.groupingBy(Tienda::getEstado));

        model.addAttribute("tiendasPendientes", tiendasPorEstado.getOrDefault(EstadoTienda.PENDIENTE, List.of()));
        model.addAttribute("tiendasActivas", tiendasPorEstado.getOrDefault(EstadoTienda.ACTIVA, List.of()));
        model.addAttribute("tiendasInactivas", tiendasPorEstado.getOrDefault(EstadoTienda.INACTIVA, List.of()));

        return "admin/admin_dashboard";
    }

    @PostMapping("/usuarios/guardar")
    public String guardarUsuario(@ModelAttribute("usuarioDto") UsuarioAdminDTO usuarioDTO, RedirectAttributes redirectAttributes) {
        try {
            adminService.guardarUsuario(usuarioDTO);
            redirectAttributes.addFlashAttribute("success", "Usuario guardado exitosamente.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/usuarios/cambiar-estado/{id}")
    public String cambiarEstadoUsuario(@PathVariable Integer id, RedirectAttributes redirectAttributes) {
        try {
            adminService.cambiarEstadoUsuario(id);
            redirectAttributes.addFlashAttribute("success", "Estado del usuario actualizado.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }

    @GetMapping("/usuarios/{id}")
    @ResponseBody
    public UsuarioAdminDTO obtenerUsuarioParaEditar(@PathVariable Integer id) {
        return adminService.buscarUsuarioPorId(id)
            .map(usuario -> {
                UsuarioAdminDTO dto = new UsuarioAdminDTO();
                dto.setId(usuario.getId());
                dto.setNombre(usuario.getNombre());
                dto.setApellido(usuario.getApellido());
                dto.setCorreo(usuario.getCorreo());
                dto.setCedula(usuario.getCedula());
                dto.setRolesIds(usuario.getRoles().stream().map(Rol::getId).collect(Collectors.toList()));
                return dto;
            })
            .orElse(null);
    }

    @PostMapping("/tiendas/aprobar/{id}")
    public String aprobarTienda(@PathVariable Integer id, RedirectAttributes redirectAttributes) {
        try {
            adminService.aprobarTienda(id);
            redirectAttributes.addFlashAttribute("success", "Tienda aprobada exitosamente.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/tiendas/inhabilitar/{id}")
    public String inhabilitarTienda(@PathVariable Integer id, RedirectAttributes redirectAttributes) {
        try {
            adminService.rechazarOInhabilitarTienda(id);
            redirectAttributes.addFlashAttribute("success", "Tienda inhabilitada/rechazada exitosamente.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }

    @PostMapping("/tiendas/reactivar/{id}")
    public String reactivarTienda(@PathVariable Integer id, RedirectAttributes redirectAttributes) {
         try {
            adminService.reactivarTienda(id);
            redirectAttributes.addFlashAttribute("success", "Tienda reactivada exitosamente.");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", "Error: " + e.getMessage());
        }
        return "redirect:/admin/dashboard";
    }
    
    @GetMapping("/tiendas/{id}")
    @ResponseBody
    public ResponseEntity<TiendaDetallesDTO> obtenerTiendaPorId(@PathVariable Integer id) {
        return adminService.buscarTiendaDetallesPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}