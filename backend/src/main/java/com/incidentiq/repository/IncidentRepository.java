package com.incidentiq.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.incidentiq.Model.Incident;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByTitleContainingIgnoreCase(String title);

    List<Incident> findByStatusIgnoreCase(String status);

    List<Incident> findByPriorityIgnoreCase(String priority);

    List<Incident> findBySeverityIgnoreCase(String severity);

    @Query("SELECT i.status, COUNT(i) FROM Incident i GROUP BY i.status")
    List<Object[]> countIncidentsByStatus();

    @Query("SELECT i.priority, COUNT(i) FROM Incident i GROUP BY i.priority")
    List<Object[]> countIncidentsByPriority();

    @Query("SELECT i.severity, COUNT(i) FROM Incident i GROUP BY i.severity")
    List<Object[]> countIncidentsBySeverity();

    @Query("""
            SELECT i FROM Incident i
            WHERE (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%')))
            AND (:status IS NULL OR LOWER(i.status) = LOWER(:status))
            AND (:priority IS NULL OR LOWER(i.priority) = LOWER(:priority))
            AND (:severity IS NULL OR LOWER(i.severity) = LOWER(:severity))
            """)
    Page<Incident> searchAndFilter(
            @Param("title") String title,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("severity") String severity,
            Pageable pageable
    );
}