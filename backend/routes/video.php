<?php
// backend/routes/video.php

require_once __DIR__ . '/../controllers/VideoController.php';
$controller = new VideoController();

$param   = $GLOBALS['rotas_parametros'] ?? [];
$method  = $_SERVER['REQUEST_METHOD'];

error_log("video.php rota recebida: " . implode('/', $param) . " - método: $method");

if ($method === 'GET' && count($param) === 2) {
    // Ex.: rota=video/5/1 → bibliotecaId=5, usuarioId=1
    $bibliotecaId = (int) $param[0];
    $usuarioId    = (int) $param[1];
    $controller->detalhes($bibliotecaId, $usuarioId);

} elseif ($method !== 'GET') {
    // Método não permitido
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);

} else {
    // Rota inválida
    http_response_code(404);
    echo json_encode(['erro' => 'Rota não encontrada']);
}
