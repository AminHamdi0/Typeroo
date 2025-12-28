package com.typeroo.api.models;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Document(collection = "test_results")
public class TestResult {
    @Id
    private String id;

    private String userId;
    private String username;

    private double wpm;
    private double rawWpm;
    private double accuracy;
    private int duration; // 10, 30, 60 etc.

    private int correctChars;
    private int incorrectChars;

    @CreatedDate
    private LocalDateTime timestamp;

    public TestResult(String userId, String username, double wpm, double rawWpm, double accuracy, int duration,
            int correctChars, int incorrectChars) {
        this.userId = userId;
        this.username = username;
        this.wpm = wpm;
        this.rawWpm = rawWpm;
        this.accuracy = accuracy;
        this.duration = duration;
        this.correctChars = correctChars;
        this.incorrectChars = incorrectChars;
        this.timestamp = LocalDateTime.now();
    }
}
