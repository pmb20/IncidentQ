package com.incidentiq.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.Model.Attachment;
import com.incidentiq.service.AttachmentService;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService service;

    public AttachmentController(AttachmentService service) {
        this.service = service;
    }

    @PostMapping
    public Attachment createAttachment(@RequestBody Attachment attachment) {
        return service.save(attachment);
    }

    @GetMapping("/incident/{incidentId}")
    public List<Attachment> getAttachments(
            @PathVariable Long incidentId) {

        return service.getByIncidentId(incidentId);
    }

    @GetMapping("/{id}")
    public Attachment getAttachment(@PathVariable Long id) {
        return service.getById(id);
    }

    @DeleteMapping("/{id}")
    public String deleteAttachment(@PathVariable Long id) {
        service.delete(id);
        return "Attachment deleted successfully";
    }
}