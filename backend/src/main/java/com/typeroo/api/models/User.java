package com.typeroo.api.models;

import java.util.HashSet;
import java.util.Set;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @NotBlank
    @Size(max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(max = 120)
    private String password;

    private Set<ERole> roles = new HashSet<>();

    private String bio;

    private String avatarUrl;

    // Total tests taken
    private long totalTests = 0;

    @CreatedDate
    private LocalDateTime joinedAt;

    private LocalDateTime lastUsernameUpdate;

    private String themePreference = "dark"; // default theme

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.joinedAt = LocalDateTime.now();
    }
}
