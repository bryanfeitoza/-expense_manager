package com.gerenciador.controller;

import com.gerenciador.dto.SavingGoalRequest;
import com.gerenciador.dto.SavingGoalResponse;
import com.gerenciador.security.UserPrincipal;
import com.gerenciador.service.SavingGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saving-goals")
@RequiredArgsConstructor
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @PostMapping
    public ResponseEntity<SavingGoalResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SavingGoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savingGoalService.create(principal.getUserId(), request));
    }

    @GetMapping
    public ResponseEntity<List<SavingGoalResponse>> findAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(savingGoalService.findAll(principal.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingGoalResponse> findById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(savingGoalService.findById(principal.getUserId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingGoalResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SavingGoalRequest request) {
        return ResponseEntity.ok(savingGoalService.update(principal.getUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        savingGoalService.delete(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
