package com.remington.unieats.marketplace.service;

import com.remington.unieats.marketplace.model.entity.Usuario;
import com.remington.unieats.marketplace.model.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void generateAndSendResetToken(String email, String siteURL) {
        usuarioRepository.findByCorreo(email).ifPresent(usuario -> {
            String token = UUID.randomUUID().toString();
            usuario.setResetPasswordToken(token);
            usuario.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1)); // Token válido por 1 hora
            usuarioRepository.save(usuario);

            String resetLink = siteURL + "/reset-password?token=" + token;
            sendEmail(usuario.getCorreo(), resetLink);
        });
        // Si no se encuentra el usuario, no hacemos nada para no revelar si un correo existe.
    }

    private void sendEmail(String recipientAddress, String link) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipientAddress);
        message.setSubject("Restablecimiento de Contraseña - Uni-Eats Marketplace");
        message.setText("Hola,\n\nHas solicitado restablecer tu contraseña.\n" +
                "Haz clic en el siguiente enlace para cambiar tu contraseña:\n\n" + link +
                "\n\nSi no solicitaste esto, por favor ignora este correo.\n\n" +
                "Gracias,\nEquipo de Uni-Eats.");
        mailSender.send(message);
    }

    public Usuario validatePasswordResetToken(String token) {
        return usuarioRepository.findByResetPasswordToken(token)
                .filter(user -> user.getResetPasswordTokenExpiry().isAfter(LocalDateTime.now()))
                .orElse(null); // Token no válido o expirado
    }

    public void updatePassword(Usuario usuario, String newPassword) {
        usuario.setContrasenaHash(passwordEncoder.encode(newPassword));
        usuario.setResetPasswordToken(null); // Invalida el token
        usuario.setResetPasswordTokenExpiry(null);
        usuarioRepository.save(usuario);
    }
}
