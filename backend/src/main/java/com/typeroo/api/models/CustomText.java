package com.typeroo.api.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Document(collection = "custom_texts")
public class CustomText {
    @Id
    private String id;

    private String userId;

    @NotBlank
    private String content;

    private boolean isPublic;

    @CreatedDate
    private LocalDateTime createdAt;

    public CustomText(String userId, String content, boolean isPublic) {
        this.userId = userId;
        this.content = content;
        this.isPublic = isPublic;
        this.createdAt = LocalDateTime.now();
    }
}
