package com.typeroo.api.payload.response;

import java.util.List;
import lombok.Data;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String id;
    private String username;
    private String email;
    private List<String> roles;
    private String themePreference;

    public JwtResponse(String accessToken, String id, String username, String email, String themePreference,
            List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.themePreference = themePreference;
        this.roles = roles;
    }
}
