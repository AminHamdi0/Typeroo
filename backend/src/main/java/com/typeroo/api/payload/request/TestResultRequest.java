package com.typeroo.api.payload.request;

import lombok.Data;

@Data
public class TestResultRequest {
    private double wpm;
    private double rawWpm;
    private double accuracy;
    private int duration;
    private int correctChars;
    private int incorrectChars;
}
