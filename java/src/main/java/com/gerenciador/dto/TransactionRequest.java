package com.gerenciador.dto;

import com.gerenciador.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {
    @NotNull
    private TransactionType type;
    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;
    private String description;
    @NotNull
    private LocalDate transactionDate;
    private UUID categoryId;
    private UUID accountId;
    private boolean isRecurring;
    private String recurringFrequency;
    private String notes;
}
