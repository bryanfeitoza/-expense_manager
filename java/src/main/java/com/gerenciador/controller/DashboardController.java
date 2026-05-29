package com.gerenciador.controller;

import com.gerenciador.dto.DashboardSummaryResponse;
import com.gerenciador.security.UserPrincipal;
import com.gerenciador.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> summary(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getSummary(principal.getUserId()));
    }

    @GetMapping("/monthly-evolution")
    public ResponseEntity<Map<String, Object>> monthlyEvolution(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(dashboardService.getMonthlyEvolution(principal.getUserId(), months));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<Map<String, Object>> categoryBreakdown(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getCategoryBreakdown(principal.getUserId()));
    }
}
