package com.incidentiq.Controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final String uploadFolder = "uploads/";

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file)
            throws IOException {

        if (file.isEmpty()) {
            return "Please select a file";
        }

        Path folder = Paths.get(uploadFolder);

        if (!Files.exists(folder)) {
            Files.createDirectories(folder);
        }

        Path filePath = folder.resolve(file.getOriginalFilename());

        Files.write(filePath, file.getBytes());

        return "File uploaded successfully: " + file.getOriginalFilename();
    }
}