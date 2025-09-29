package com.remington.unieats.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configurar el manejo de imágenes locales
        registry.addResourceHandler("/productos/**")
                .addResourceLocations("file:./uploads/productos/");
                
        registry.addResourceHandler("/logos/**")
                .addResourceLocations("file:./uploads/logos/");
    }
}