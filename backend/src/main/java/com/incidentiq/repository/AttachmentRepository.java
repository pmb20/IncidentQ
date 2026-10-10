package com.incidentiq.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentiq.Model.Attachment;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByIncidentId(Long incidentId);
}