package com.typeroo.api.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSettingsRequest {
    @Size(max = 20)
    private String username;

    @Size(max = 50)
    @Email
    private String email;

    @Size(max = 120, min = 6)
    private String password;

    private String currentPassword;

    private String themePreference;
}
