package com.remington.unieats.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
@Profile("render")
public class RenderConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RenderConfig.class);
    
    @Bean
    public ApplicationRunner renderStartupInfo(DataSource dataSource) {
        return args -> {
            logger.info("🚀 ===== RENDER DEPLOYMENT - STARTUP INFO =====");
            logger.info("📦 Profile: render");
            logger.info("🌐 Port: {}", System.getenv().getOrDefault("PORT", "8080"));
            
            try (Connection connection = dataSource.getConnection()) {
                String url = connection.getMetaData().getURL();
                String databaseProduct = connection.getMetaData().getDatabaseProductName();
                
                logger.info("✅ Database connected successfully!");
                logger.info("🗄️  Database: {}", databaseProduct);
                logger.info("🔗 URL: {}", url.replaceAll("password=[^&]*", "password=***"));
                
                if (url.contains("h2")) {
                    logger.warn("⚠️  Using H2 in-memory database (data will be lost on restart)");
                    logger.info("💡 To use PostgreSQL, set DATABASE_URL environment variable");
                } else if (url.contains("postgresql")) {
                    logger.info("🐘 Using PostgreSQL database");
                }
                
            } catch (Exception e) {
                logger.error("❌ Database connection failed: {}", e.getMessage());
            }
            
            logger.info("🚀 ===== APPLICATION READY =====");
        };
    }
}