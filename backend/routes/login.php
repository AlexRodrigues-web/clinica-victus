<?php
// backend/routes/login.php

// Aplica cabeçalhos CORS (evita erro ao enviar requisição POST de outro domínio)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Trata requisição pré-flight diretamente ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../controllers/LoginController.php';

error_log("Rota login.php acessada");

// --- Lê o corpo da requisição ---
$inputJSON = file_get_contents('php://input');
$dados = json_decode($inputJSON, true);

// --- Verifica se JSON é válido ---
if (!$dados) {
    error_log("login.php - JSON inválido ou ausente");
    http_response_code(400);
    echo json_encode(['erro' => 'Requisição inválida']);
    exit;
}

// --- Chama o Controller para autenticar ---
$loginController = new LoginController();
$resposta = $loginController->autenticar($dados);

// --- Retorna resposta apropriada ---
if (isset($resposta['erro'])) {
    http_response_code(401);
} else {
    http_response_code(200);
}

echo json_encode($resposta);
