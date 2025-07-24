<?php
// backend/index.php

// --- CORS: permite requisições do frontend React ---
header("Access-Control-Allow-Origin: *"); // Em produção, especifique o domínio do frontend
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Trata requisições pré-flight (OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_log("index.php acessado");

// --- Obtém a rota passada como parâmetro ---
$rota = $_GET['rota'] ?? null;
if (!$rota) {
    error_log("index.php - Nenhuma rota informada");
    http_response_code(400);
    echo json_encode(['erro' => 'Rota não especificada']);
    exit;
}

// --- Separa a rota e seus segmentos ---
$partes      = explode('/', trim($rota, '/'));
$arquivoRota = array_shift($partes);  // ex.: "biblioteca", "video", "perfil"
$parametros  = $partes;               // ex.: ["progresso","1"], ["foto"], etc.

// Se for rota "perfil", mapeia o primeiro segmento para $_GET['acao']
if ($arquivoRota === 'perfil' && count($parametros) > 0) {
    $_GET['acao'] = array_shift($parametros);
}

// Torna parâmetros disponíveis globalmente, se precisar
$GLOBALS['rotas_parametros'] = $parametros;

// --- Monta o caminho do arquivo de rota correspondente ---
$caminho = __DIR__ . "/routes/{$arquivoRota}.php";

if (file_exists($caminho)) {
    error_log("index.php - Rota encontrada: $rota");
    require_once $caminho;
} else {
    error_log("index.php - Rota não encontrada: $rota");
    http_response_code(404);
    echo json_encode(['erro' => 'Rota não encontrada']);
}
