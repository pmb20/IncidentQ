package com.incidentiq.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.incidentiq.dto.Logindto;
import com.incidentiq.dto.Userdto;
import com.incidentiq.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createUser(
            @Valid @RequestBody Userdto user) {

        service.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message",
                        "User registered successfully"
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @Valid @RequestBody Logindto loginRequest) {

        String result = service.login(loginRequest);

        if ("User not found".equals(result)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", result));
        }

        if ("Invalid password".equals(result)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", result));
        }

        if ("Invalid login request".equals(result)) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", result));
        }

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful",
                        "token", result
                )
        );
    }
}