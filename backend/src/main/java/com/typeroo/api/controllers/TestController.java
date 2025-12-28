package com.typeroo.api.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.typeroo.api.models.TestResult;
import com.typeroo.api.models.User;
import com.typeroo.api.payload.request.TestResultRequest;
import com.typeroo.api.payload.response.MessageResponse;
import com.typeroo.api.payload.response.UserStatsResponse;
import com.typeroo.api.repository.TestResultRepository;
import com.typeroo.api.repository.UserRepository;
import com.typeroo.api.security.service.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tests")
public class TestController {
    @Autowired
    TestResultRepository testResultRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping("/history")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyHistory(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<TestResult> pageResults = testResultRepository.findByUserIdOrderByTimestampDesc(userDetails.getId(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(pageResults);
    }

    @GetMapping("/user-history")
    public ResponseEntity<?> getUserHistory(
            @RequestParam String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Page<TestResult> pageResults = testResultRepository.findByUserIdOrderByTimestampDesc(userOpt.get().getId(),
                PageRequest.of(page, size));
        return ResponseEntity.ok(pageResults);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats(@RequestParam String username) {
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty())
            return ResponseEntity.notFound().build();

        String userId = userOpt.get().getId();

        List<TestResult> tests10 = testResultRepository.findByUserIdAndDurationOrderByWpmDesc(userId, 10);
        List<TestResult> tests30 = testResultRepository.findByUserIdAndDurationOrderByWpmDesc(userId, 30);
        List<TestResult> tests60 = testResultRepository.findByUserIdAndDurationOrderByWpmDesc(userId, 60);

        double max10 = tests10.isEmpty() ? 0 : tests10.get(0).getWpm();
        double max30 = tests30.isEmpty() ? 0 : tests30.get(0).getWpm();
        double max60 = tests60.isEmpty() ? 0 : tests60.get(0).getWpm();

        return ResponseEntity.ok(new UserStatsResponse(max10, max30, max60));
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> saveTestResult(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody TestResultRequest request) {

        TestResult result = new TestResult(
                userDetails.getId(),
                userDetails.getUsername(),
                request.getWpm(),
                request.getRawWpm(),
                request.getAccuracy(),
                request.getDuration(),
                request.getCorrectChars(),
                request.getIncorrectChars());
        result.setTimestamp(LocalDateTime.now());

        testResultRepository.save(result);

        userRepository.findById(userDetails.getId()).ifPresent(u -> {
            u.setTotalTests(u.getTotalTests() + 1);
            userRepository.save(u);
        });

        return ResponseEntity.ok(new MessageResponse("Test result saved successfully"));
    }
}
