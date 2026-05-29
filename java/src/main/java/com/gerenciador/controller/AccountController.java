package com.gerenciador.controller;

import com.gerenciador.dto.AccountRequest;
import com.gerenciador.dto.AccountResponse;
import com.gerenciador.security.UserPrincipal;
import com.gerenciador.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.create(principal.getUserId(), request));
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> findAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(accountService.findAll(principal.getUserId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> findById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(accountService.findById(principal.getUserId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequest request) {
        return ResponseEntity.ok(accountService.update(principal.getUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        accountService.delete(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
