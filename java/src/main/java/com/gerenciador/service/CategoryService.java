package com.gerenciador.service;

import com.gerenciador.dto.CategoryRequest;
import com.gerenciador.dto.CategoryResponse;
import com.gerenciador.exception.ResourceNotFoundException;
import com.gerenciador.model.Category;
import com.gerenciador.model.CategoryType;
import com.gerenciador.model.TransactionType;
import com.gerenciador.model.User;
import com.gerenciador.repository.CategoryRepository;
import com.gerenciador.repository.TransactionRepository;
import com.gerenciador.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public CategoryResponse create(UUID userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Category category = Category.builder()
                .user(user)
                .name(request.getName())
                .icon(request.getIcon())
                .color(request.getColor())
                .type(request.getType())
                .monthlyLimit(request.getMonthlyLimit())
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(UUID userId, UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
        if (!category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Categoria", id);
        }
        return toResponseWithSpent(category, userId);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll(UUID userId) {
        return categoryRepository.findByUserId(userId).stream()
                .map(c -> toResponseWithSpent(c, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse update(UUID userId, UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
        if (!category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Categoria", id);
        }

        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setType(request.getType());
        category.setMonthlyLimit(request.getMonthlyLimit());

        category = categoryRepository.save(category);
        return toResponseWithSpent(category, userId);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
        if (!category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Categoria", id);
        }
        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .type(category.getType())
                .monthlyLimit(category.getMonthlyLimit())
                .build();
    }

    private CategoryResponse toResponseWithSpent(Category category, UUID userId) {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        TransactionType transactionType = category.getType() == CategoryType.RECEITA
                ? TransactionType.RECEITA : TransactionType.DESPESA;

        BigDecimal spent = transactionRepository.sumByUserAndCategoryAndTypeAndDateBetween(
                userId, category.getId(), transactionType, start, end);
        if (spent == null) spent = BigDecimal.ZERO;

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .type(category.getType())
                .monthlyLimit(category.getMonthlyLimit())
                .spent(spent)
                .build();
    }
}
