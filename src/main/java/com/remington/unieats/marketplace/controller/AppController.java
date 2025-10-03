package com.remington.unieats.marketplace.controller;

import com.remington.unieats.marketplace.dto.EstudianteRegistroDTO;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.service.PasswordResetService;
import com.remington.unieats.marketplace.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AppController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private PasswordResetService passwordResetService;

    @GetMapping("/")
    public String mostrarPaginaInicio(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN_PLATAFORMA"))) {
                return "redirect:/admin/dashboard";
            }
            else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_VENDEDOR"))) {
                return "redirect:/dashboard/vendedor";
            }
            else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ESTUDIANTE"))) {
                return "redirect:/dashboard/estudiante";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String mostrarPaginaLogin() {
        return "login";
    }

    @GetMapping("/registro")
    public String mostrarFormularioDeRegistro(Model model) {
        model.addAttribute("estudiante", new EstudianteRegistroDTO());
        return "registro";
    }

    @PostMapping("/registro")
    public String registrarCuentaDeEstudiante(@ModelAttribute("estudiante") EstudianteRegistroDTO registroDTO, 
                                            Model model, 
                                            RedirectAttributes redirectAttributes) {
        try {
            // Validaciones básicas en el backend
            if (registroDTO.getNombre() == null || registroDTO.getNombre().trim().isEmpty()) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "El nombre es obligatorio");
                return "registro";
            }
            
            if (registroDTO.getApellido() == null || registroDTO.getApellido().trim().isEmpty()) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "El apellido es obligatorio");
                return "registro";
            }
            
            if (registroDTO.getCedula() == null || registroDTO.getCedula().trim().isEmpty()) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "La cédula es obligatoria");
                return "registro";
            }
            
            if (registroDTO.getCorreo() == null || registroDTO.getCorreo().trim().isEmpty()) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "El correo electrónico es obligatorio");
                return "registro";
            }
            
            if (registroDTO.getPassword() == null || registroDTO.getPassword().trim().isEmpty()) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "La contraseña es obligatoria");
                return "registro";
            }
            
            // Validaciones de longitud y formato
            if (registroDTO.getCedula().length() < 6 || registroDTO.getCedula().length() > 12) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "La cédula debe tener entre 6 y 12 dígitos");
                return "registro";
            }
            
            if (!registroDTO.getCedula().matches("^[0-9]+$")) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "La cédula solo puede contener números");
                return "registro";
            }
            
            if (registroDTO.getPassword().length() < 8 || registroDTO.getPassword().length() > 50) {
                model.addAttribute("estudiante", registroDTO);
                model.addAttribute("error", "La contraseña debe tener entre 8 y 50 caracteres");
                return "registro";
            }
            
                // Validaciones adicionales para contraseña segura
                String password = registroDTO.getPassword();
                if (!password.matches(".*[a-z].*")) {
                    model.addAttribute("estudiante", registroDTO);
                    model.addAttribute("error", "La contraseña debe contener al menos una letra minúscula");
                    return "registro";
                }
            
                if (!password.matches(".*[A-Z].*")) {
                    model.addAttribute("estudiante", registroDTO);
                    model.addAttribute("error", "La contraseña debe contener al menos una letra mayúscula");
                    return "registro";
                }
            
                if (!password.matches(".*[0-9].*")) {
                    model.addAttribute("estudiante", registroDTO);
                    model.addAttribute("error", "La contraseña debe contener al menos un número");
                    return "registro";
                }
            
                if (!password.matches(".*[@$!%*?&].*")) {
                    model.addAttribute("estudiante", registroDTO);
                    model.addAttribute("error", "La contraseña debe contener al menos un carácter especial (@$!%*?&)");
                    return "registro";
                }
            
            usuarioService.registrarEstudiante(registroDTO);
            redirectAttributes.addFlashAttribute("success", "¡Te has registrado exitosamente! Ya puedes iniciar sesión.");
            return "redirect:/login";
        } catch (RuntimeException e) {
            model.addAttribute("estudiante", registroDTO);
            model.addAttribute("error", e.getMessage());
            return "registro";
        }
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordForm() {
        return "forgot_password_form";
    }
 
    @PostMapping("/forgot-password")
    public String processForgotPassword(HttpServletRequest request, Model model) {
        String email = request.getParameter("email");
        String siteURL = request.getRequestURL().toString().replace(request.getServletPath(), "");
        passwordResetService.generateAndSendResetToken(email, siteURL);
        model.addAttribute("message", "Si tu correo está registrado, hemos enviado un enlace para restablecer tu contraseña.");
        return "forgot_password_form";
    }

    @GetMapping("/reset-password")
    public String showResetPasswordForm(@RequestParam String token, Model model, RedirectAttributes redirectAttributes) {
        Usuario usuario = passwordResetService.validatePasswordResetToken(token);
        if (usuario == null) {
            redirectAttributes.addFlashAttribute("error", "El enlace para restablecer la contraseña es inválido o ha expirado.");
            return "redirect:/login";
        }
        model.addAttribute("token", token);
        return "reset_password_form";
    }

    @PostMapping("/reset-password")
    public String processResetPassword(HttpServletRequest request, RedirectAttributes redirectAttributes) {
        String token = request.getParameter("token");
        String password = request.getParameter("password");
        Usuario usuario = passwordResetService.validatePasswordResetToken(token);
        if (usuario == null) {
            redirectAttributes.addFlashAttribute("error", "El enlace es inválido o ha expirado. Por favor, intenta de nuevo.");
            return "redirect:/login";
        }
        passwordResetService.updatePassword(usuario, password);
        redirectAttributes.addFlashAttribute("success", "Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.");
        return "redirect:/login";
    }
    
    @GetMapping("/error/403")
    public String error403() {
        return "error/403";
    }
    
    @PostMapping("/custom-logout")
    public String customLogout(HttpServletRequest request, RedirectAttributes redirectAttributes) {
        // Invalidar la sesión manualmente
        if (request.getSession(false) != null) {
            request.getSession().invalidate();
        }
        redirectAttributes.addFlashAttribute("success", "Has cerrado sesión exitosamente.");
        return "redirect:/login?logout";
    }
}