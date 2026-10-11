package com.incidentiq.service;

import com.incidentiq.Model.Comment;
import com.incidentiq.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository repository;

    public CommentService(CommentRepository repository) {
        this.repository = repository;
    }

    public Comment save(Comment comment) {
        return repository.save(comment);
    }

    public List<Comment> getByIncidentId(Long incidentId) {
        return repository.findByIncidentId(incidentId);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
