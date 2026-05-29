package com.gerenciador.service;

import com.gerenciador.dto.DashboardSummaryResponse;
import com.gerenciador.model.Transaction;
import com.gerenciador.model.TransactionType;
import com.gerenciador.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(UUID userId) {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal totalReceitas = transactionRepository.sumByUserAndTypeAndDateBetween(
                userId, TransactionType.RECEITA, startOfMonth, endOfMonth);
        BigDecimal totalDespesas = transactionRepository.sumByUserAndTypeAndDateBetween(
                userId, TransactionType.DESPESA, startOfMonth, endOfMonth);
        long count = transactionRepository.countByUserIdAndTransactionDateBetween(userId, startOfMonth, endOfMonth);

        if (totalReceitas == null) totalReceitas = BigDecimal.ZERO;
        if (totalDespesas == null) totalDespesas = BigDecimal.ZERO;

        BigDecimal saldo = totalReceitas.subtract(totalDespesas);

        Map<String, BigDecimal> receitasPorCategoria = new LinkedHashMap<>();
        List<Object[]> receitasGroup = transactionRepository.categoryGrouping(
                userId, TransactionType.RECEITA, startOfMonth, endOfMonth);
        for (Object[] row : receitasGroup) {
            receitasPorCategoria.put((String) row[0], (BigDecimal) row[1]);
        }

        Map<String, BigDecimal> despesasPorCategoria = new LinkedHashMap<>();
        List<Object[]> despesasGroup = transactionRepository.categoryGrouping(
                userId, TransactionType.DESPESA, startOfMonth, endOfMonth);
        for (Object[] row : despesasGroup) {
            despesasPorCategoria.put((String) row[0], (BigDecimal) row[1]);
        }

        return DashboardSummaryResponse.builder()
                .totalReceitas(totalReceitas)
                .totalDespesas(totalDespesas)
                .saldo(saldo)
                .transactionCount(count)
                .receitasPorCategoria(receitasPorCategoria)
                .despesasPorCategoria(despesasPorCategoria)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyEvolution(UUID userId, int months) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusMonths(months - 1).withDayOfMonth(1);

        List<Object[]> receitas = transactionRepository.monthlyGrouping(
                userId, TransactionType.RECEITA, start, end);
        List<Object[]> despesas = transactionRepository.monthlyGrouping(
                userId, TransactionType.DESPESA, start, end);

        Map<String, BigDecimal> receitasMap = new LinkedHashMap<>();
        for (Object[] row : receitas) {
            String key = String.format("%04d-%02d", (Integer) row[0], (Integer) row[1]);
            receitasMap.put(key, (BigDecimal) row[2]);
        }

        Map<String, BigDecimal> despesasMap = new LinkedHashMap<>();
        for (Object[] row : despesas) {
            String key = String.format("%04d-%02d", (Integer) row[0], (Integer) row[1]);
            despesasMap.put(key, (BigDecimal) row[2]);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("receitas", receitasMap);
        result.put("despesas", despesasMap);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryBreakdown(UUID userId) {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        List<Object[]> receitas = transactionRepository.categoryGrouping(
                userId, TransactionType.RECEITA, startOfMonth, endOfMonth);
        List<Object[]> despesas = transactionRepository.categoryGrouping(
                userId, TransactionType.DESPESA, startOfMonth, endOfMonth);

        Map<String, BigDecimal> receitasMap = new LinkedHashMap<>();
        for (Object[] row : receitas) {
            receitasMap.put((String) row[0], (BigDecimal) row[1]);
        }

        Map<String, BigDecimal> despesasMap = new LinkedHashMap<>();
        for (Object[] row : despesas) {
            despesasMap.put((String) row[0], (BigDecimal) row[1]);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("receitas", receitasMap);
        result.put("despesas", despesasMap);
        return result;
    }
}
