package com.typeroo.api.controllers;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import java.nio.file.*;
import java.io.IOException;

import com.typeroo.api.models.User;
import com.typeroo.api.payload.request.UpdateProfileRequest;
import com.typeroo.api.payload.request.UpdateSettingsRequest;
import com.typeroo.api.payload.response.MessageResponse;
import com.typeroo.api.repository.UserRepository;
import com.typeroo.api.security.service.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Optional<User> user = userRepository.findById(userDetails.getId());
        if (user.isPresent()) {
            user.get().setPassword(null); // Don't return password
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            user.get().setPassword(null);
            user.get().setEmail(null); // specific privacy for public profile
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/upload-avatar")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            // Basic validation
            if (fileName.contains("..")) {
                return ResponseEntity.badRequest().body(new MessageResponse("Filename contains invalid path sequence"));
            }

            // Randomize name to avoid conflicts
            String newFileName = userDetails.getId() + "_" + System.currentTimeMillis() + "_" + fileName;
            Path uploadDir = Paths.get("./uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            Path targetLocation = uploadDir.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Create URL
            // Assuming default port 8080 and context /api or root
            String fileUrl = "http://localhost:8080/uploads/" + newFileName;

            Optional<User> userOpt = userRepository.findById(userDetails.getId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setAvatarUrl(fileUrl);
                userRepository.save(user);
                return ResponseEntity.ok(new MessageResponse(fileUrl)); // Return the new URL
            }

            return ResponseEntity.notFound().build();
        } catch (IOException ex) {
            return ResponseEntity.status(500).body(new MessageResponse("Could not upload file: " + ex.getMessage()));
        }
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UpdateProfileRequest request) {
        Optional<User> userOpt = userRepository.findById(userDetails.getId());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (request.getBio() != null && !request.getBio().trim().isEmpty())
                user.setBio(request.getBio());
            if (request.getAvatarUrl() != null && !request.getAvatarUrl().trim().isEmpty())
                user.setAvatarUrl(request.getAvatarUrl());

            userRepository.save(user);
            return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Query cannot be empty"));
        }
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
        users.forEach(u -> {
            u.setPassword(null);
            u.setEmail(null);
        });
        return ResponseEntity.ok(users);
    }

    @PostMapping("/settings")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UpdateSettingsRequest request) {
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        if (request.getThemePreference() != null) {
            user.setThemePreference(request.getThemePreference());
        }

        // Sensitive changes require password verification
        boolean sensitiveChange = (request.getUsername() != null && !request.getUsername().equals(user.getUsername()))
                ||
                (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) ||
                (request.getPassword() != null && !request.getPassword().isEmpty());

        if (sensitiveChange) {
            if (request.getCurrentPassword() == null
                    || !encoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid current password"));
            }
        }

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
            }
            if (user.getLastUsernameUpdate() != null) {
                long months = ChronoUnit.MONTHS.between(user.getLastUsernameUpdate(), LocalDateTime.now());
                if (months < 1) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: You can only change your username once a month."));
                }
            }
            user.setUsername(request.getUsername());
            user.setLastUsernameUpdate(LocalDateTime.now());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Settings updated successfully"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        userRepository.deleteById(userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Account deleted successfully"));
    }
}
