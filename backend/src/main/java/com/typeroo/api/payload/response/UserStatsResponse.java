package com.typeroo.api.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStatsResponse {
    private double maxWpm10;
    private double maxWpm30;
    private double maxWpm60;
}
