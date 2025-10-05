package com.remington.unieats.marketplace.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
@Profile("prod")
public class DatabaseHealthCheck {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseHealthCheck.class);
    
    @Bean
    public ApplicationRunner databaseConnectionCheck(DataSource dataSource) {
        return args -> {
            logger.info("=".repeat(50));
            logger.info("VERIFICANDO CONECTIVIDAD DE BASE DE DATOS");
            logger.info("=".repeat(50));
            
            try (Connection connection = dataSource.getConnection()) {
                String url = connection.getMetaData().getURL();
                String username = connection.getMetaData().getUserName();
                String databaseProduct = connection.getMetaData().getDatabaseProductName();
                String databaseVersion = connection.getMetaData().getDatabaseProductVersion();
                
                logger.info("✅ CONEXIÓN EXITOSA!");
                logger.info("📊 Base de datos: {}", databaseProduct);
                logger.info("📋 Versión: {}", databaseVersion);
                logger.info("🔗 URL: {}", url);
                logger.info("👤 Usuario: {}", username);
                logger.info("=".repeat(50));
                
            } catch (Exception e) {
                logger.error("❌ ERROR DE CONEXIÓN A BASE DE DATOS");
                logger.error("🔍 Detalles del error: {}", e.getMessage());
                logger.error("📋 Tipo de excepción: {}", e.getClass().getSimpleName());
                
                if (e.getCause() != null) {
                    logger.error("🔗 Causa raíz: {}", e.getCause().getMessage());
                }
                
                logger.error("=".repeat(50));
                logger.error("💡 POSIBLES SOLUCIONES:");
                logger.error("1. Verificar variables de entorno en Render");
                logger.error("2. Verificar conectividad de red Render -> Supabase");
                logger.error("3. Verificar configuración SSL de Supabase");
                logger.error("4. Considerar usar H2 como fallback temporal");
                logger.error("=".repeat(50));
                
                // No lanzar excepción para permitir que la app arranque
                logger.warn("⚠️  Aplicación iniciará sin base de datos funcional");
            }
        };
    }
}