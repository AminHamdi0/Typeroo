package com.typeroo.api.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomTextRequest {
    @NotBlank
    private String content;

    private boolean isPublic;
}
