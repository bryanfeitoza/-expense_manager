package com.gerenciador.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final SecretKey accessSecret;
    private final SecretKey refreshSecret;
    private final long accessExpiresIn;
    private final long refreshExpiresIn;

    public JwtTokenProvider(
            @Value("${app.jwt.access-secret}") String accessSecret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret,
            @Value("${app.jwt.access-expires-in}") long accessExpiresIn,
            @Value("${app.jwt.refresh-expires-in}") long refreshExpiresIn) {
        this.accessSecret = getSecretKey(accessSecret);
        this.refreshSecret = getSecretKey(refreshSecret);
        this.accessExpiresIn = accessExpiresIn;
        this.refreshExpiresIn = refreshExpiresIn;
    }

    private SecretKey getSecretKey(String secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (Exception e) {
            return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }

    public String generateAccessToken(UUID userId, String email, String name) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpiresIn);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("name", name)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(accessSecret)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpiresIn);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(refreshSecret)
                .compact();
    }

    public boolean validateAccessToken(String token) {
        try {
            Jwts.parser().verifyWith(accessSecret).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            Jwts.parser().verifyWith(refreshSecret).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public UUID getUserIdFromAccessToken(String token) {
        return UUID.fromString(getAccessClaims(token).getSubject());
    }

    public String getEmailFromAccessToken(String token) {
        return getAccessClaims(token).get("email", String.class);
    }

    public UUID getUserIdFromRefreshToken(String token) {
        return UUID.fromString(getRefreshClaims(token).getSubject());
    }

    private Claims getAccessClaims(String token) {
        return Jwts.parser()
                .verifyWith(accessSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Claims getRefreshClaims(String token) {
        return Jwts.parser()
                .verifyWith(refreshSecret)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
