package com.incidentiq.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.incidentiq.Model.Resolution;
import com.incidentiq.repository.ResolutionRepository;

@Service
public class ResolutionService {

    private final ResolutionRepository repository;

    public ResolutionService(ResolutionRepository repository) {
        this.repository = repository;
    }

    public Resolution save(Resolution resolution) {
        return repository.save(resolution);
    }

    public List<Resolution> getByIncidentId(Long incidentId) {
        return repository.findByIncidentId(incidentId);
    }

    public Resolution getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}