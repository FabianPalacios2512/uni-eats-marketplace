package com.remington.unieats.marketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;

@Configuration
@Profile("prod")
public class DatabaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    
    @Value("${DATABASE_URL:jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE}")
    private String databaseUrl;
    
    @Value("${DATABASE_USERNAME:sa}")
    private String username;
    
    @Value("${DATABASE_PASSWORD:}")
    private String password;
    
    @Value("${DATABASE_DRIVER:org.h2.Driver}")
    private String driverClassName;

    @Bean
    public DataSource dataSource() {
        logger.info("Configurando DataSource para producción...");
        logger.info("Database URL: {}", databaseUrl.replaceAll("password=[^&]*", "password=***"));
        
        HikariConfig config = new HikariConfig();
        
        // Configuración básica
        config.setJdbcUrl(databaseUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        
        // Si es PostgreSQL (Supabase), configurar SSL y optimizaciones
        if (databaseUrl.contains("postgresql")) {
            logger.info("Configurando para PostgreSQL/Supabase...");
            
            // Configuraciones SSL para Supabase
            config.addDataSourceProperty("sslmode", "require");
            config.addDataSourceProperty("prepareThreshold", "0");
            config.addDataSourceProperty("preparedStatementCacheQueries", "0");
            config.addDataSourceProperty("preparedStatementCacheSizeMiB", "0");
            config.addDataSourceProperty("reWriteBatchedInserts", "true");
            
            // Timeouts más largos para conexiones remotas
            config.setConnectionTimeout(60000); // 60 segundos
            config.setIdleTimeout(900000); // 15 minutos
            config.setMaxLifetime(1800000); // 30 minutos
            config.setLeakDetectionThreshold(120000); // 2 minutos
            
            // Pool específico para Render + Supabase
            config.setMaximumPoolSize(2);
            config.setMinimumIdle(1);
            
        } else {
            logger.info("Configurando para H2 (fallback)...");
            
            // Configuración para H2
            config.setConnectionTimeout(10000); // 10 segundos
            config.setIdleTimeout(300000); // 5 minutos
            config.setMaxLifetime(600000); // 10 minutos
            config.setMaximumPoolSize(5);
            config.setMinimumIdle(2);
        }
        
        // Configuraciones generales
        config.setConnectionTestQuery("SELECT 1");
        config.setValidationTimeout(5000);
        config.setInitializationFailTimeout(-1); // No fallar si no puede inicializar
        
        try {
            HikariDataSource dataSource = new HikariDataSource(config);
            logger.info("DataSource configurado exitosamente");
            return dataSource;
        } catch (Exception e) {
            logger.error("Error configurando DataSource: {}", e.getMessage());
            throw e;
        }
    }
}