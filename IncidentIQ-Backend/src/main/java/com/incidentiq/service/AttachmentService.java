package com.incidentiq.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.incidentiq.Model.Attachment;
import com.incidentiq.repository.AttachmentRepository;

@Service
public class AttachmentService {

    private final AttachmentRepository repository;

    public AttachmentService(AttachmentRepository repository) {
        this.repository = repository;
    }

    public Attachment save(Attachment attachment) {
        return repository.save(attachment);
    }

    public List<Attachment> getByIncidentId(Long incidentId) {
        return repository.findByIncidentId(incidentId);
    }

    public Attachment getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}