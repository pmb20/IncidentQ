package com.incidentiq.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentiq.Model.IncidentAudit;

public interface IncidentAuditRepository
        extends JpaRepository<IncidentAudit, Long> {

    List<IncidentAudit> findByIncidentIdOrderByChangedAtDescIdDesc(
            Long incidentId);
}
