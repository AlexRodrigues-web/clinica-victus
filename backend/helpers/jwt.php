<?php
// backend/helpers/jwt.php

const JWT_SECRET = "SUA_CHAVE_SECRETA_AQUI"; // troque por uma chave forte na produção
const JWT_EXPIRACAO = 3600; // em segundos (1h)

function gerarJWT($usuario) {
    $cabecalho = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $payload = json_encode([
        'id' => $usuario['id'],
        'email' => $usuario['email'],
        'nivel' => $usuario['nivel'],
        'exp' => time() + JWT_EXPIRACAO
    ]);

    $base64Cabecalho = base64_encode($cabecalho);
    $base64Payload = base64_encode($payload);

    $assinatura = hash_hmac('sha256', "$base64Cabecalho.$base64Payload", JWT_SECRET, true);
    $base64Assinatura = base64_encode($assinatura);

    $token = "$base64Cabecalho.$base64Payload.$base64Assinatura";

    error_log("JWT gerado para usuário ID {$usuario['id']}");

    return $token;
}

function validarJWT($token) {
    $partes = explode('.', $token);
    if (count($partes) !== 3) {
        error_log("JWT inválido: estrutura incorreta");
        return false;
    }

    list($base64Cabecalho, $base64Payload, $base64Assinatura) = $partes;

    $assinaturaEsperada = base64_encode(
        hash_hmac('sha256', "$base64Cabecalho.$base64Payload", JWT_SECRET, true)
    );

    if (!hash_equals($assinaturaEsperada, $base64Assinatura)) {
        error_log("JWT inválido: assinatura incorreta");
        return false;
    }

    $payload = json_decode(base64_decode($base64Payload), true);

    if (!isset($payload['exp']) || $payload['exp'] < time()) {
        error_log("JWT expirado");
        return false;
    }

    error_log("JWT válido para usuário ID {$payload['id']}");
    return $payload;
}
