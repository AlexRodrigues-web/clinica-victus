<?php
// backend/routes/video.php

require_once __DIR__ . '/../controllers/VideoController.php';
$controller = new VideoController();

$param   = $GLOBALS['rotas_parametros'] ?? [];
$method  = $_SERVER['REQUEST_METHOD'];

error_log("video.php rota recebida: " . implode('/', $param) . " - método: $method");

if ($method === 'GET') {
    if (count($param) === 3 && strtolower($param[0]) === 'detalhes') {
        $bibliotecaId = (int) $param[1];
        $usuarioId    = (int) $param[2];
        $controller->detalhes($bibliotecaId, $usuarioId);
    } elseif (count($param) === 2) {
        $bibliotecaId = (int) $param[0];
        $usuarioId    = (int) $param[1];
        $controller->detalhes($bibliotecaId, $usuarioId);
    } else {
        http_response_code(400);
        echo json_encode(['erro' => 'Parâmetros inválidos para rota video']);
    }


} else {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
}
