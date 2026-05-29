package com.gerenciador.service;

import com.gerenciador.dto.SavingGoalRequest;
import com.gerenciador.dto.SavingGoalResponse;
import com.gerenciador.exception.ResourceNotFoundException;
import com.gerenciador.model.SavingGoal;
import com.gerenciador.model.User;
import com.gerenciador.repository.SavingGoalRepository;
import com.gerenciador.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavingGoalService {

    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;

    @Transactional
    public SavingGoalResponse create(UUID userId, SavingGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        SavingGoal goal = SavingGoal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .currentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : BigDecimal.ZERO)
                .deadline(request.getDeadline())
                .color(request.getColor())
                .icon(request.getIcon())
                .completed(false)
                .build();

        goal = savingGoalRepository.save(goal);
        return toResponse(goal);
    }

    @Transactional(readOnly = true)
    public SavingGoalResponse findById(UUID userId, UUID id) {
        SavingGoal goal = savingGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta", id));
        if (!goal.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Meta", id);
        }
        return toResponse(goal);
    }

    @Transactional(readOnly = true)
    public List<SavingGoalResponse> findAll(UUID userId) {
        return savingGoalRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SavingGoalResponse update(UUID userId, UUID id, SavingGoalRequest request) {
        SavingGoal goal = savingGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta", id));
        if (!goal.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Meta", id);
        }

        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        if (request.getCurrentAmount() != null) {
            goal.setCurrentAmount(request.getCurrentAmount());
        }
        goal.setDeadline(request.getDeadline());
        goal.setColor(request.getColor());
        goal.setIcon(request.getIcon());
        goal.setCompleted(goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0);

        goal = savingGoalRepository.save(goal);
        return toResponse(goal);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        SavingGoal goal = savingGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta", id));
        if (!goal.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Meta", id);
        }
        savingGoalRepository.delete(goal);
    }

    private SavingGoalResponse toResponse(SavingGoal goal) {
        BigDecimal progress = BigDecimal.ZERO;
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = goal.getCurrentAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP);
        }

        return SavingGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .progress(progress)
                .deadline(goal.getDeadline())
                .color(goal.getColor())
                .icon(goal.getIcon())
                .completed(goal.isCompleted())
                .createdAt(goal.getCreatedAt())
                .build();
    }
}
