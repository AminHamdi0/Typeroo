package com.typeroo.api.payload.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 300)
    private String bio;

    private String avatarUrl;

    @Size(max = 50)
    private String displayName;
}
