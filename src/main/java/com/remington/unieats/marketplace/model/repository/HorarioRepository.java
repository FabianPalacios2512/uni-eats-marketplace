package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Tienda;
import com.remington.unieats.marketplace.model.enums.DiaSemana;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Integer> {

    // MÉTODO AÑADIDO (PARA EL ERROR 1)
    List<Horario> findByTienda(Tienda tienda);

    // MÉTODO AÑADIDO (PARA EL ERROR 2)
    Optional<Horario> findByTiendaAndDia(Tienda tienda, DiaSemana dia);
}