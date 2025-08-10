<?php
// backend/routes/aulas.php

// CORS + JSON
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../controllers/AulasController.php';

$controller = new AulasController();
$param      = $GLOBALS['rotas_parametros'] ?? [];
$method     = $_SERVER['REQUEST_METHOD'];

error_log("routes/aulas.php -> method={$method} | params=" . json_encode($param));

if ($method === 'GET') {
    // /aulas/detalhes/:bibliotecaId/:usuarioId
    if (count($param) === 3 && strtolower($param[0]) === 'detalhes') {
        $bid = (int)$param[1];
        $uid = (int)$param[2];
        error_log("AULAS GET detalhes | bid={$bid} uid={$uid}");
        $controller->detalhes($bid, $uid);
        exit;
    }

    // fallback: /aulas/:bibliotecaId/:usuarioId
    if (count($param) === 2) {
        $bid = (int)$param[0];
        $uid = (int)$param[1];
        error_log("AULAS GET fallback detalhes | bid={$bid} uid={$uid}");
        $controller->detalhes($bid, $uid);
        exit;
    }

    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros inválidos para GET /aulas']);
    exit;
}

if ($method === 'POST') {
    // /aulas/progresso  (body: { aula_id, usuario_id, percentual })
    if (count($param) === 1 && strtolower($param[0]) === 'progresso') {
        error_log("AULAS POST progresso");
        if (!method_exists($controller, 'atualizarProgresso')) {
            http_response_code(501);
            echo json_encode(['sucesso' => false, 'erro' => 'Método atualizarProgresso não implementado']);
            exit;
        }
        $controller->atualizarProgresso();
        exit;
    }

    http_response_code(400);
    echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros inválidos para POST /aulas']);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido em /aulas']);
