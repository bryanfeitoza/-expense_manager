package com.gerenciador.service;

import com.gerenciador.dto.PaginatedResponse;
import com.gerenciador.dto.TransactionRequest;
import com.gerenciador.dto.TransactionResponse;
import com.gerenciador.exception.ResourceNotFoundException;
import com.gerenciador.model.Account;
import com.gerenciador.model.Category;
import com.gerenciador.model.Transaction;
import com.gerenciador.model.TransactionType;
import com.gerenciador.model.User;
import com.gerenciador.repository.AccountRepository;
import com.gerenciador.repository.CategoryRepository;
import com.gerenciador.repository.TransactionRepository;
import com.gerenciador.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public TransactionResponse create(UUID userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria", request.getCategoryId()));
        }

        Account account = null;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta", request.getAccountId()));
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .category(category)
                .account(account)
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .isRecurring(request.isRecurring())
                .recurringFrequency(request.getRecurringFrequency())
                .notes(request.getNotes())
                .build();

        transaction = transactionRepository.save(transaction);

        if (account != null) {
            BigDecimal newBalance = request.getType() == TransactionType.RECEITA
                    ? account.getBalance().add(request.getAmount())
                    : account.getBalance().subtract(request.getAmount());
            account.setBalance(newBalance);
            accountRepository.save(account);
        }

        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponse findById(UUID userId, UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação", id));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transação", id);
        }
        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<TransactionResponse> findAll(UUID userId, Pageable pageable) {
        Page<Transaction> page = transactionRepository.findByUserId(userId, pageable);
        return toPaginatedResponse(page);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<TransactionResponse> findByType(UUID userId, TransactionType type, Pageable pageable) {
        Page<Transaction> page = transactionRepository.findByUserIdAndType(userId, type, pageable);
        return toPaginatedResponse(page);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> findByDateRange(UUID userId, LocalDate start, LocalDate end) {
        return transactionRepository.findByUserIdAndTransactionDateBetween(userId, start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse update(UUID userId, UUID id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação", id));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transação", id);
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria", request.getCategoryId()));
        }

        Account account = null;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta", request.getAccountId()));
        }

        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.setRecurring(request.isRecurring());
        transaction.setRecurringFrequency(request.getRecurringFrequency());
        transaction.setNotes(request.getNotes());

        transaction = transactionRepository.save(transaction);
        return toResponse(transaction);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação", id));
        if (!transaction.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Transação", id);
        }
        transactionRepository.delete(transaction);
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .categoryId(transaction.getCategory() != null ? transaction.getCategory().getId() : null)
                .categoryName(transaction.getCategory() != null ? transaction.getCategory().getName() : null)
                .accountId(transaction.getAccount() != null ? transaction.getAccount().getId() : null)
                .accountName(transaction.getAccount() != null ? transaction.getAccount().getName() : null)
                .isRecurring(transaction.isRecurring())
                .recurringFrequency(transaction.getRecurringFrequency())
                .notes(transaction.getNotes())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private PaginatedResponse<TransactionResponse> toPaginatedResponse(Page<Transaction> page) {
        List<TransactionResponse> content = page.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());

        return PaginatedResponse.<TransactionResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
