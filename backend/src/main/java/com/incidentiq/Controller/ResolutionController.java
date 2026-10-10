package com.incidentiq.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.Model.Resolution;
import com.incidentiq.service.ResolutionService;

@RestController
@RequestMapping("/api/resolutions")
public class ResolutionController {

    private final ResolutionService service;

    public ResolutionController(ResolutionService service) {
        this.service = service;
    }

    @PostMapping
    public Resolution createResolution(@RequestBody Resolution resolution) {
        return service.save(resolution);
    }

    @GetMapping("/incident/{incidentId}")
    public List<Resolution> getResolutions(
            @PathVariable Long incidentId) {

        return service.getByIncidentId(incidentId);
    }

    @GetMapping("/{id}")
    public Resolution getResolution(@PathVariable Long id) {
        return service.getById(id);
    }

    @DeleteMapping("/{id}")
    public String deleteResolution(@PathVariable Long id) {
        service.delete(id);
        return "Resolution deleted successfully";
    }
}