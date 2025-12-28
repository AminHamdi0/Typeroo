package com.typeroo.api.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.typeroo.api.models.CustomText;

public interface CustomTextRepository extends MongoRepository<CustomText, String> {
    List<CustomText> findByUserId(String userId);
}
