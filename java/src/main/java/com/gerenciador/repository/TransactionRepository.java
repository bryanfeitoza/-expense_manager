package com.gerenciador.repository;

import com.gerenciador.model.Transaction;
import com.gerenciador.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Page<Transaction> findByUserId(UUID userId, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionDateBetween(UUID userId, LocalDate start, LocalDate end);

    List<Transaction> findByUserIdAndCategoryId(UUID userId, UUID categoryId);

    Page<Transaction> findByUserIdAndType(UUID userId, TransactionType type, Pageable pageable);

    Page<Transaction> findByUserIdAndCategoryId(UUID userId, UUID categoryId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumByUserAndTypeAndDateBetween(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.category.id = :categoryId AND t.type = :type AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumByUserAndCategoryAndTypeAndDateBetween(@Param("userId") UUID userId, @Param("categoryId") UUID categoryId, @Param("type") TransactionType type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT FUNCTION('YEAR', t.transactionDate) as yr, FUNCTION('MONTH', t.transactionDate) as mo, COALESCE(SUM(t.amount), 0) as total FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND t.transactionDate BETWEEN :start AND :end GROUP BY FUNCTION('YEAR', t.transactionDate), FUNCTION('MONTH', t.transactionDate) ORDER BY yr, mo")
    List<Object[]> monthlyGrouping(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(c.name, 'Sem categoria'), COALESCE(SUM(t.amount), 0) FROM Transaction t LEFT JOIN t.category c WHERE t.user.id = :userId AND t.type = :type AND t.transactionDate BETWEEN :start AND :end GROUP BY c.name ORDER BY SUM(t.amount) DESC")
    List<Object[]> categoryGrouping(@Param("userId") UUID userId, @Param("type") TransactionType type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    long countByUserIdAndTransactionDateBetween(UUID userId, LocalDate start, LocalDate end);
}
