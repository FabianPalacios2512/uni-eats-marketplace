package com.remington.unieats.marketplace.config;

import com.remington.unieats.marketplace.model.entity.Rol;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.repository.RolRepository;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        crearRolSiNoExiste("ESTUDIANTE");
        crearRolSiNoExiste("VENDEDOR");
        crearRolSiNoExiste("ADMIN_PLATAFORMA");

        if (usuarioRepository.findByCorreo("admin@unieats.com").isEmpty()) {
            Rol adminRol = rolRepository.findByNombre("ADMIN_PLATAFORMA").orElseThrow();

            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setApellido("UniEats");
            admin.setCorreo("admin@unieats.com");
            // ===== ¡LÍNEA AÑADIDA! =====
            admin.setCedula("0000"); // Cédula de prueba para el admin
            // ============================
            admin.setContrasenaHash(passwordEncoder.encode("admin123"));
            admin.setActivo(true);
            admin.setRoles(Set.of(adminRol));
            
            usuarioRepository.save(admin);
        }
    }

    private void crearRolSiNoExiste(String nombreRol) {
        if (rolRepository.findByNombre(nombreRol).isEmpty()) {
            Rol nuevoRol = new Rol();
            nuevoRol.setNombre(nombreRol);
            rolRepository.save(nuevoRol);
        }
    }
}