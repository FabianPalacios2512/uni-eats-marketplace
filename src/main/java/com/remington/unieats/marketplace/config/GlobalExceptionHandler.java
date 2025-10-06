package com.remington.unieats.marketplace.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleApiException(Exception ex, WebRequest request, HttpServletRequest httpRequest) {
        String uri = httpRequest.getRequestURI();
        
        // Solo manejar excepciones de API REST, no de vistas Thymeleaf
        if (uri.startsWith("/api/")) {
            logger.error("❌ Error en API uri={}: {}", uri, ex.getMessage(), ex);
            
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", LocalDateTime.now());
            errorDetails.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorDetails.put("error", "Internal Server Error");
            errorDetails.put("message", ex.getMessage());
            errorDetails.put("path", uri);
            
            return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        // Para vistas web, dejamos que Spring maneje el error normalmente
        return null; // Permite que otros manejadores de errores lo procesen
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleApiIllegalStateException(IllegalStateException ex, WebRequest request, HttpServletRequest httpRequest) {
        String uri = httpRequest.getRequestURI();
        
        // Solo para APIs
        if (uri.startsWith("/api/")) {
            logger.error("❌ Estado ilegal en API uri={}: {}", uri, ex.getMessage());
            
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", LocalDateTime.now());
            errorDetails.put("status", HttpStatus.BAD_REQUEST.value());
            errorDetails.put("error", "Bad Request");
            errorDetails.put("message", ex.getMessage());
            errorDetails.put("path", uri);
            
            return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
        }
        
        return null; // Permite que otros manejadores lo procesen
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleApiRuntimeException(RuntimeException ex, WebRequest request, HttpServletRequest httpRequest) {
        String uri = httpRequest.getRequestURI();
        
        // Solo para APIs
        if (uri.startsWith("/api/")) {
            logger.error("❌ Error de runtime en API uri={}: {}", uri, ex.getMessage(), ex);
            
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("timestamp", LocalDateTime.now());
            errorDetails.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorDetails.put("error", "Runtime Error");
            errorDetails.put("message", "Error durante la ejecución de la operación");
            errorDetails.put("path", uri);
            
            return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        return null; // Permite que otros manejadores lo procesen
    }
}