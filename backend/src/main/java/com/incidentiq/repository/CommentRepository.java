package com.incidentiq.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.incidentiq.Model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByIncidentId(Long incidentId);
}