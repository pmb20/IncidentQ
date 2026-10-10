package com.incidentiq.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentiq.Model.Resolution;

public interface ResolutionRepository extends JpaRepository<Resolution, Long> {

    List<Resolution> findByIncidentId(Long incidentId);
}
