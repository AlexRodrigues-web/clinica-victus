<?php
require_once __DIR__ . '/jwt.php';

function validar_token() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];

    // 🔎 Log dos headers recebidos
    error_log("validar_token - HEADERS recebidos: " . print_r($headers, true));

    // Compatibilidade com servidores que retornam 'authorization' em minúsculo
    $authHeader = '';
    if (!empty($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (!empty($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    }

    if (empty($authHeader)) {
        error_log("validar_token - Token ausente no header");
        return false;
    }

    // Remove prefixo Bearer
    $token = trim(preg_replace('/Bearer\s+/i', '', $authHeader));

    if (empty($token)) {
        error_log("validar_token - Header Authorization encontrado, mas token vazio");
        return false;
    }

    // Valida JWT
    $payload = validarJWT($token);
    if ($payload === false) {
        error_log("validar_token - Token inválido ou expirado");
        return false;
    }

    // Log de sucesso
    error_log("validar_token - Token válido para usuário ID: {$payload['id']}");

    return $payload['id'] ?? false;
}
