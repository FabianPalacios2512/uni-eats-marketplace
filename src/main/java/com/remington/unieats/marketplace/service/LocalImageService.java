package com.remington.unieats.marketplace.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalImageService {

    @Value("${app.upload.directory:./uploads}")
    private String uploadDirectory;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        Path uploadPath = Paths.get(uploadDirectory, folder);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID().toString();
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        String uniqueFileName = fileName + fileExtension;
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/" + folder + "/" + uniqueFileName;
    }

    public void deleteImage(String imageUrl) {
        try {
            if (imageUrl != null && !imageUrl.isEmpty()) {
                String relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
                Path filePath = Paths.get(uploadDirectory, relativePath);
                
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                }
            }
        } catch (IOException e) {
            System.err.println("Error eliminando imagen: " + e.getMessage());
        }
    }

    public boolean imageExists(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isEmpty()) {
                return false;
            }
            
            String relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
            Path filePath = Paths.get(uploadDirectory, relativePath);
            return Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }
}
