package com.incidentiq.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.Model.Comment;
import com.incidentiq.service.CommentService;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    @PostMapping
    public Comment createComment(@RequestBody Comment comment) {
        return service.save(comment);
    }

    @GetMapping("/incident/{incidentId}")
    public List<Comment> getComments(@PathVariable Long incidentId) {
        return service.getByIncidentId(incidentId);
    }

    @DeleteMapping("/{id}")
    public String deleteComment(@PathVariable Long id) {
        service.delete(id);
        return "Comment deleted successfully";
    }
}