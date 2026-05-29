package com.gerenciador.dto;

import com.gerenciador.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private LocalDate transactionDate;
    private UUID categoryId;
    private String categoryName;
    private UUID accountId;
    private String accountName;
    private boolean isRecurring;
    private String recurringFrequency;
    private String notes;
    private LocalDateTime createdAt;
}
