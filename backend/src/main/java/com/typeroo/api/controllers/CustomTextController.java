package com.typeroo.api.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.typeroo.api.models.CustomText;
import com.typeroo.api.payload.request.CustomTextRequest;
import com.typeroo.api.payload.response.MessageResponse;
import com.typeroo.api.repository.CustomTextRepository;
import com.typeroo.api.security.service.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/custom-texts")
public class CustomTextController {
    @Autowired
    CustomTextRepository customTextRepository;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyCustomTexts(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<CustomText> texts = customTextRepository.findByUserId(userDetails.getId());
        return ResponseEntity.ok(texts);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addCustomText(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CustomTextRequest request) {
        CustomText text = new CustomText(userDetails.getId(), request.getContent(), request.isPublic());
        customTextRepository.save(text);
        return ResponseEntity.ok(new MessageResponse("Custom text added successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteCustomText(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String id) {
        // Check if text belongs to user
        var textOpt = customTextRepository.findById(id);
        if (textOpt.isPresent() && textOpt.get().getUserId().equals(userDetails.getId())) {
            customTextRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Deleted successfully"));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Cannot delete text"));
    }
}
