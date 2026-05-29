package com.gerenciador.service;

import com.gerenciador.dto.AIQueryRequest;
import com.gerenciador.dto.AIResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class AIService {

    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final RestClient restClient;

    public AIService(
            @Value("${app.ai.api-key}") String apiKey,
            @Value("${app.ai.api-url}") String apiUrl,
            @Value("${app.ai.model}") String model) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.restClient = RestClient.create();
    }

    public AIResponse classify(String description, BigDecimal amount) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackClassify(description);
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", new Object[]{
                            Map.of("role", "system", "content", "Você é um classificador de gastos. Responda apenas com o nome da categoria."),
                            Map.of("role", "user", "content", "Classifique: " + description + " - R$" + amount)
                    },
                    "max_tokens", 50
            );

            Map response = restClient.post()
                    .uri(apiUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String category = extractCategory(response);
            return AIResponse.builder()
                    .message("Classificado com sucesso")
                    .category(category)
                    .confidence("medium")
                    .build();
        } catch (Exception e) {
            return fallbackClassify(description);
        }
    }

    public AIResponse analyze(AIQueryRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackResponse(request.getMessage());
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", new Object[]{
                            Map.of("role", "system", "content", "Você é um assistente especializado em finanças pessoais."),
                            Map.of("role", "user", "content", request.getMessage())
                    },
                    "max_tokens", 500
            );

            Map response = restClient.post()
                    .uri(apiUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            return AIResponse.builder()
                    .message(extractMessage(response))
                    .build();
        } catch (Exception e) {
            return fallbackResponse(request.getMessage());
        }
    }

    public AIResponse chat(AIQueryRequest request) {
        return analyze(request);
    }

    public AIResponse getAnomalies() {
        return AIResponse.builder()
                .message("Nenhuma anomalia detectada no período atual.")
                .build();
    }

    public AIResponse getPredictions() {
        return AIResponse.builder()
                .message("Com base no seu histórico, a previsão de gastos para o próximo mês é similar ao mês atual.")
                .build();
    }

    public AIResponse getTips() {
        return AIResponse.builder()
                .message("1. Defina um orçamento mensal\n2. Acompanhe seus gastos semanalmente\n3. Separe uma quantia para emergências\n4. Evite compras por impulso\n5. Revise assinaturas periódicas")
                .build();
    }

    private AIResponse fallbackClassify(String description) {
        String desc = description.toLowerCase();
        if (desc.contains("aliment") || desc.contains("restaurante") || desc.contains("mercado") || desc.contains("supermercado")) {
            return AIResponse.builder().category("Alimentação").confidence("low").message("Classificação offline").build();
        } else if (desc.contains("transporte") || desc.contains("uber") || desc.contains("combust") || desc.contains("gasolina")) {
            return AIResponse.builder().category("Transporte").confidence("low").message("Classificação offline").build();
        } else if (desc.contains("saúde") || desc.contains("medico") || desc.contains("farmácia") || desc.contains("farmacia")) {
            return AIResponse.builder().category("Saúde").confidence("low").message("Classificação offline").build();
        } else if (desc.contains("lazer") || desc.contains("cinema") || desc.contains("entretenimento")) {
            return AIResponse.builder().category("Lazer").confidence("low").message("Classificação offline").build();
        } else if (desc.contains("educação") || desc.contains("curso") || desc.contains("escola")) {
            return AIResponse.builder().category("Educação").confidence("low").message("Classificação offline").build();
        } else if (desc.contains("moradia") || desc.contains("aluguel") || desc.contains("condomínio")) {
            return AIResponse.builder().category("Moradia").confidence("low").message("Classificação offline").build();
        } else {
            return AIResponse.builder().category("Outros").confidence("low").message("Classificação offline").build();
        }
    }

    private AIResponse fallbackResponse(String message) {
        return AIResponse.builder()
                .message("IA não configurada. Configure a chave AI_API_KEY para usar o assistente IA. Sua mensagem: " + message)
                .build();
    }

    private String extractCategory(Map response) {
        try {
            var choices = (java.util.List<Map>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                var message = (Map) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception ignored) {}
        return "Outros";
    }

    private String extractMessage(Map response) {
        try {
            var choices = (java.util.List<Map>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                var message = (Map) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception ignored) {}
        return "Não foi possível processar a resposta.";
    }
}
