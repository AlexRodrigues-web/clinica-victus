<?php
// backend/routes/biblioteca.php

// --- CORS: libera requisições do React em localhost:3000 ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

// trata preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../controllers/BibliotecaController.php';

$controller  = new BibliotecaController();
$parametros  = $GLOBALS['rotas_parametros'] ?? [];
$method      = $_SERVER['REQUEST_METHOD'];

// --------------------------
// POST /biblioteca/adicionar[/{tipo}]
// --------------------------
if (
    $method === 'POST' &&
    count($parametros) >= 1 &&
    $parametros[0] === 'adicionar'
) {
    // se vier tipo na URL, passa para o método
    $tipo = $parametros[1] ?? null;
    error_log("Rota POST /biblioteca/adicionar" . ($tipo ? "/{$tipo}" : '') . " acionada");
    $controller->adicionar($tipo);

// --------------------------
// GET /biblioteca/progresso/{usuario_id}
// --------------------------
} elseif (
    $method === 'GET' &&
    count($parametros) === 2 &&
    $parametros[0] === 'progresso'
) {
    $usuarioId = (int) $parametros[1];
    error_log("Rota GET /biblioteca/progresso/{$usuarioId} acionada");
    $controller->listarComProgresso($usuarioId);

// --------------------------
// GET /biblioteca
// --------------------------
} elseif (
    $method === 'GET' &&
    count($parametros) === 0
) {
    error_log("Rota GET /biblioteca acionada");
    $controller->listar();

// --------------------------
// Rota inválida
// --------------------------
} else {
    error_log("Rota inválida em biblioteca.php: " . json_encode([
        'method'     => $method,
        'parametros' => $parametros
    ]));
    http_response_code(404);
    echo json_encode(['erro' => 'Rota não encontrada']);
}
