package com.gerenciador.service;

import com.gerenciador.dto.AccountRequest;
import com.gerenciador.dto.AccountResponse;
import com.gerenciador.exception.ResourceNotFoundException;
import com.gerenciador.model.Account;
import com.gerenciador.model.User;
import com.gerenciador.repository.AccountRepository;
import com.gerenciador.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public AccountResponse create(UUID userId, AccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Account account = Account.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance())
                .currency(request.getCurrency() != null ? request.getCurrency() : "BRL")
                .build();

        account = accountRepository.save(account);
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public AccountResponse findById(UUID userId, UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", id));
        if (!account.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Conta", id);
        }
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> findAll(UUID userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AccountResponse update(UUID userId, UUID id, AccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", id));
        if (!account.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Conta", id);
        }

        account.setName(request.getName());
        account.setType(request.getType());
        account.setBalance(request.getBalance());
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }

        account = accountRepository.save(account);
        return toResponse(account);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta", id));
        if (!account.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Conta", id);
        }
        accountRepository.delete(account);
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
