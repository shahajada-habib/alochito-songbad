package com.alochitosongbad.auth;

public record LoginResponse(String token, String username, String role) {
}
