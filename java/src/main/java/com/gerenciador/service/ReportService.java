package com.gerenciador.service;

import com.gerenciador.model.Transaction;
import com.gerenciador.model.TransactionType;
import com.gerenciador.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryReport(UUID userId, LocalDate start, LocalDate end) {
        List<Object[]> receitas = transactionRepository.categoryGrouping(
                userId, TransactionType.RECEITA, start, end);
        List<Object[]> despesas = transactionRepository.categoryGrouping(
                userId, TransactionType.DESPESA, start, end);

        Map<String, BigDecimal> receitasMap = new LinkedHashMap<>();
        BigDecimal totalReceitas = BigDecimal.ZERO;
        for (Object[] row : receitas) {
            BigDecimal val = (BigDecimal) row[1];
            receitasMap.put((String) row[0], val);
            totalReceitas = totalReceitas.add(val);
        }

        Map<String, BigDecimal> despesasMap = new LinkedHashMap<>();
        BigDecimal totalDespesas = BigDecimal.ZERO;
        for (Object[] row : despesas) {
            BigDecimal val = (BigDecimal) row[1];
            despesasMap.put((String) row[0], val);
            totalDespesas = totalDespesas.add(val);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodo", Map.of("inicio", start.toString(), "fim", end.toString()));
        result.put("receitas", receitasMap);
        result.put("despesas", despesasMap);
        result.put("totalReceitas", totalReceitas);
        result.put("totalDespesas", totalDespesas);
        result.put("saldo", totalReceitas.subtract(totalDespesas));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyReport(UUID userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return getCategoryReport(userId, start, end);
    }

    @Transactional(readOnly = true)
    public String exportCsv(UUID userId, LocalDate start, LocalDate end) {
        List<Transaction> transactions = transactionRepository
                .findByUserIdAndTransactionDateBetween(userId, start, end);

        StringBuilder csv = new StringBuilder();
        csv.append("Data,Tipo,Valor,Descrição,Categoria,Conta,Recorrente,Observações\n");

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Transaction t : transactions) {
            csv.append(t.getTransactionDate().format(dateFormatter)).append(",");
            csv.append(t.getType() == TransactionType.RECEITA ? "Receita" : "Despesa").append(",");
            csv.append(t.getAmount()).append(",");
            csv.append(escapeCsv(t.getDescription())).append(",");
            csv.append(escapeCsv(t.getCategory() != null ? t.getCategory().getName() : "")).append(",");
            csv.append(escapeCsv(t.getAccount() != null ? t.getAccount().getName() : "")).append(",");
            csv.append(t.isRecurring() ? "Sim" : "Não").append(",");
            csv.append(escapeCsv(t.getNotes())).append("\n");
        }

        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
