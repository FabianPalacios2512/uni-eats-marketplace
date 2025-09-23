package com.remington.unieats.marketplace.service;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

@Service
public class S3ImageService {

    @Autowired(required = false)
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name:unieats-marketplace-images}")
    private String bucketName;

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${app.environment:local}")
    private String environment;

    @PostConstruct
    public void init() {
        // Solo crear bucket si tenemos cliente S3 disponible
        if (s3Client != null) {
            try {
                createBucketIfNotExists();
                System.out.println("S3 Client initialized successfully");
            } catch (Exception e) {
                System.err.println("Warning: Could not verify S3 bucket: " + e.getMessage());
                System.err.println("S3 uploads may not work. Continuing with local fallback.");
                // No lanzar excepción para permitir que la app arranque
            }
        } else {
            System.out.println("S3 Client not available - using local storage");
        }
    }

    /**
     * Subir imagen a S3 o filesystem local según el ambiente
     */
    public String uploadImage(MultipartFile file, String folder) {
        System.out.println("=== DEBUG S3ImageService ===");
        System.out.println("Environment: " + environment);
        System.out.println("S3 Client available: " + (s3Client != null));
        System.out.println("Bucket name: " + bucketName);
        System.out.println("Folder: " + folder);
        
        if (file == null || file.isEmpty()) {
            System.out.println("File is null or empty");
            return null;
        }

        try {
            String fileName = generateUniqueFileName(file);
            String key = folder + "/" + fileName;
            System.out.println("Generated key: " + key);

            if (isS3Available()) {
                System.out.println("Using S3 storage");
                // Subir a S3 en producción
                return uploadToS3(file, key);
            } else {
                System.out.println("Using local storage");
                // Fallback a filesystem local para desarrollo
                return uploadToLocal(file, folder, fileName);
            }

        } catch (Exception e) {
            System.out.println("Error uploading image: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al subir imagen: " + e.getMessage(), e);
        }
    }

    /**
     * Subir imagen específicamente para productos
     */
    public String uploadProductImage(MultipartFile file) {
        return uploadImage(file, "productos");
    }

    /**
     * Subir imagen específicamente para logos de tiendas
     */
    public String uploadStoreImage(MultipartFile file) {
        return uploadImage(file, "logos");
    }

    /**
     * Eliminar imagen de S3 o filesystem local
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        try {
            if (isS3Available() && imageUrl.contains("amazonaws.com")) {
                // Extraer key de la URL de S3
                String key = extractS3KeyFromUrl(imageUrl);
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build());
            } else if (imageUrl.startsWith("/uploads/")) {
                // Eliminar archivo local
                deleteLocalFile(imageUrl);
            }
        } catch (Exception e) {
            System.err.println("Error al eliminar imagen: " + e.getMessage());
            // No lanzar excepción para evitar problemas en la aplicación principal
        }
    }

    private boolean isS3Available() {
        return s3Client != null && "production".equals(environment);
    }

    private String uploadToS3(MultipartFile file, String key) throws IOException {
        System.out.println("=== uploadToS3 ===");
        System.out.println("Bucket: " + bucketName);
        System.out.println("Key: " + key);
        System.out.println("File size: " + file.getSize());
        System.out.println("Content type: " + file.getContentType());
        
        try {
            // Subir archivo a S3
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            System.out.println("Uploading to S3...");
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            System.out.println("Upload successful!");

            // Retornar URL pública de S3
            String url = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
            System.out.println("Generated URL: " + url);
            return url;
        } catch (Exception e) {
            System.out.println("Error in uploadToS3: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private String uploadToLocal(MultipartFile file, String folder, String fileName) throws IOException {
        // Fallback al sistema de archivos local (código existente)
        java.nio.file.Path uploadPath = java.nio.file.Paths.get("./uploads/" + folder);
        if (!java.nio.file.Files.exists(uploadPath)) {
            java.nio.file.Files.createDirectories(uploadPath);
        }

        java.nio.file.Path filePath = uploadPath.resolve(fileName);
        java.nio.file.Files.copy(file.getInputStream(), filePath);

        return "/uploads/" + folder + "/" + fileName;
    }

    private void createBucketIfNotExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (NoSuchBucketException e) {
            // Bucket no existe, crearlo
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            
            // Configurar política de bucket para acceso público a imágenes
            configureBucketPolicy();
        }
    }

    private void configureBucketPolicy() {
        String policy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": "arn:aws:s3:::%s/*"
                    }
                ]
            }
            """.formatted(bucketName);

        PutBucketPolicyRequest policyRequest = PutBucketPolicyRequest.builder()
                .bucket(bucketName)
                .policy(policy)
                .build();

        s3Client.putBucketPolicy(policyRequest);
    }

    private String generateUniqueFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        return UUID.randomUUID().toString() + extension;
    }

    private String extractS3KeyFromUrl(String s3Url) {
        // Extraer la key del objeto desde la URL de S3
        String[] parts = s3Url.split(".amazonaws.com/");
        return parts.length > 1 ? parts[1] : "";
    }

    private void deleteLocalFile(String imagePath) {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get("." + imagePath);
            java.nio.file.Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Error al eliminar archivo local: " + e.getMessage());
        }
    }
}