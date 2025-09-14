package com.remington.unieats.marketplace.model.repository;

import com.remington.unieats.marketplace.model.entity.Horario;
import com.remington.unieats.marketplace.model.entity.Tienda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Integer> {

    List<Horario> findByTiendaOrderByDiaAsc(Tienda tienda);

    @Transactional
    void deleteByTienda(Tienda tienda);
}