package com.remington.unieats.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${aws.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:}")
    private String secretAccessKey;

    @Bean
    public S3Client s3Client() {
        // Solo crear cliente S3 si tenemos credenciales válidas
        if (accessKeyId != null && secretAccessKey != null && 
            !accessKeyId.trim().isEmpty() && !secretAccessKey.trim().isEmpty()) {
            
            System.out.println("✅ Configurando S3 Client con credenciales AWS");
            
            AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(
                accessKeyId.trim(), 
                secretAccessKey.trim()
            );

            return S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                    .build();
        }
        
        // Retornar null si no hay credenciales (modo desarrollo local)
        System.out.println("⚠️ Sin credenciales AWS - usando almacenamiento local");
        return null;
    }
}