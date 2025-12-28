package com.typeroo.api.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.typeroo.api.models.TestResult;

public interface TestResultRepository extends MongoRepository<TestResult, String> {
    List<TestResult> findByUserId(String userId);

    Page<TestResult> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    // Find top personal bests could be complex with Mongo aggregation,
    // but for simple query we can just get all and filter or use specific queries
    // per duration
    List<TestResult> findByUserIdAndDurationOrderByWpmDesc(String userId, int duration);
}
