package com.remington.unieats.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // --- MAPEAMOS LA CARPETA DE UPLOADS (LOGOS, IMÁGENES DE PRODUCTOS) ---
        String uploadDir = Paths.get("./uploads").toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir.replace("\\", "/") + "/");

        // --- MAPEAMOS LAS CARPETAS ESTÁTICAS (JS, CSS) - ESTA ES LA SOLUCIÓN ---
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/");
        
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/");
    }
}