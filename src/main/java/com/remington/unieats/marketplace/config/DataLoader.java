package com.remington.unieats.marketplace.config;

import com.remington.unieats.marketplace.model.entity.Rol;
import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.repository.RolRepository;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import com.remington.unieats.marketplace.model.repository.TiendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TiendaRepository tiendaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 DataLoader iniciado...");
        
        crearRolSiNoExiste("ESTUDIANTE");
        crearRolSiNoExiste("VENDEDOR");
        crearRolSiNoExiste("ADMIN_PLATAFORMA");

        if (usuarioRepository.findByCorreo("admin@unieats.com").isEmpty()) {
            Rol adminRol = rolRepository.findByNombre("ADMIN_PLATAFORMA").orElseThrow();

            Usuario admin = new Usuario();
            admin.setNombre("Admin");
            admin.setApellido("UniEats");
            admin.setCorreo("admin@unieats.com");
            admin.setCedula("0000"); // Cédula de prueba para el admin
            admin.setContrasenaHash(passwordEncoder.encode("admin123"));
            admin.setActivo(true);
            admin.setRoles(Set.of(adminRol));
            
            usuarioRepository.save(admin);
            System.out.println("👤 Usuario admin creado");
        }

        // Crear usuario estudiante de prueba si no existe
        if (usuarioRepository.findByCorreo("estudiante@unieats.com").isEmpty()) {
            Rol estudianteRol = rolRepository.findByNombre("ESTUDIANTE").orElseThrow();

            Usuario estudiante = new Usuario();
            estudiante.setNombre("Juan");
            estudiante.setApellido("Pérez");
            estudiante.setCorreo("estudiante@unieats.com");
            estudiante.setCedula("1234567890");
            estudiante.setContrasenaHash(passwordEncoder.encode("estudiante123"));
            estudiante.setActivo(true);
            estudiante.setRoles(Set.of(estudianteRol));
            
            usuarioRepository.save(estudiante);
            System.out.println("🎓 Usuario estudiante creado");
        }

        // Siempre ejecutar la asignación de logos para debugging
        System.out.println("🎨 Ejecutando asignación de logos...");
        asignarLogosATiendas();
    }

    private void crearRolSiNoExiste(String nombreRol) {
        if (rolRepository.findByNombre(nombreRol).isEmpty()) {
            Rol nuevoRol = new Rol();
            nuevoRol.setNombre(nombreRol);
            rolRepository.save(nuevoRol);
        }
    }

    private void asignarLogosATiendas() {
        System.out.println("🔍 Iniciando asignación de logos...");
        
        // Mapear nombres de tiendas y logos
        Map<String, String> logosMapping = new HashMap<>();
        logosMapping.put("Tierra querida", "07fffb98-580a-41b1-9ca5-78a04c57f08d.jpeg");
        logosMapping.put("Donde Laura", "15e12d62-9b82-4248-848c-4d54ced3710b.jpeg");
        logosMapping.put("Frisby", "8caadc9a-e745-4275-8d91-9969aa591870.jpeg");
        logosMapping.put("Burger House", "15e12d62-9b82-4248-848c-4d54ced3710b.jpeg");
        logosMapping.put("Las Peludas", "6cbe7698-366b-4947-b67d-d766281822a9.png");
        logosMapping.put("Pizza Palace", "21885aee-9879-4a96-a149-e658111d1c24.jpg");
        logosMapping.put("Sushi Master", "928c3ae6-49ef-40f5-ab4f-3dcead9c597b.png");
        logosMapping.put("Café Central", "3ef69b42-0d67-4780-9d65-b7273f4ad64b.png");
        logosMapping.put("Donas Dulces", "5eacd37e-c0a3-4632-bfe9-5b9738f27e30.jpg");

        List<Tienda> tiendas = tiendaRepository.findAll();
        System.out.println("📊 Total de tiendas encontradas: " + tiendas.size());
        
        for (Tienda tienda : tiendas) {
            System.out.println("🏪 Procesando tienda: " + tienda.getNombre() + " (ID: " + tienda.getId() + ")");
            System.out.println("   Logo actual: " + tienda.getLogoUrl());
            
            String logoFileName = logosMapping.get(tienda.getNombre());
            boolean logoActualizado = false;
            
            if (logoFileName != null) {
                String logoUrl = "/uploads/logos/" + logoFileName;
                
                // Siempre actualizar si no tiene logo o si tiene el formato incorrecto
                if (tienda.getLogoUrl() == null || 
                    tienda.getLogoUrl().isEmpty() || 
                    tienda.getLogoUrl().startsWith("/logos/")) {
                    
                    tienda.setLogoUrl(logoUrl);
                    tiendaRepository.save(tienda);
                    logoActualizado = true;
                    System.out.println("   ✅ Logo actualizado a: " + logoUrl);
                } else {
                    System.out.println("   ℹ️ " + tienda.getNombre() + " ya tiene logo correcto: " + tienda.getLogoUrl());
                }
            } else {
                System.out.println("   ❌ No se encontró logo específico para: " + tienda.getNombre());
            }
            
            if (logoActualizado) {
                System.out.println("   🔄 Guardando cambios en la base de datos...");
            }
        }
        
        System.out.println("✨ Asignación de logos completada!");
    }
}