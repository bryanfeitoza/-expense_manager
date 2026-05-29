package com.gerenciador.controller;

import com.gerenciador.dto.AIQueryRequest;
import com.gerenciador.dto.AIResponse;
import com.gerenciador.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/classify")
    public ResponseEntity<AIResponse> classify(
            @RequestParam String description,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(aiService.classify(description, amount));
    }

    @PostMapping("/analyze")
    public ResponseEntity<AIResponse> analyze(@Valid @RequestBody AIQueryRequest request) {
        return ResponseEntity.ok(aiService.analyze(request));
    }

    @PostMapping("/chat")
    public ResponseEntity<AIResponse> chat(@Valid @RequestBody AIQueryRequest request) {
        return ResponseEntity.ok(aiService.chat(request));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<AIResponse> anomalies() {
        return ResponseEntity.ok(aiService.getAnomalies());
    }

    @GetMapping("/predict")
    public ResponseEntity<AIResponse> predict() {
        return ResponseEntity.ok(aiService.getPredictions());
    }

    @GetMapping("/tips")
    public ResponseEntity<AIResponse> tips() {
        return ResponseEntity.ok(aiService.getTips());
    }
}
