package com.gerenciador.dto;

import com.gerenciador.model.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private String icon;
    private String color;
    private CategoryType type;
    private BigDecimal monthlyLimit;
    private BigDecimal spent;
}
