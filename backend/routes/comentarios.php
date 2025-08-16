<?php
// backend/routes/comentarios.php

// Armazenamento simples em arquivo JSON
$__c_store_dir  = __DIR__ . '/../storage';
$__c_store_file = $__c_store_dir . '/comentarios.json';
if (!is_dir($__c_store_dir)) @mkdir($__c_store_dir, 0775, true);
if (!file_exists($__c_store_file)) file_put_contents($__c_store_file, json_encode([]));

function __c_read_all($file) {
    $txt = @file_get_contents($file);
    $data = json_decode($txt, true);
    return is_array($data) ? $data : [];
}
function __c_write_all($file, $data) {
    @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));
}

if (!isset($rota) || !is_array($rota)) { return; }
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (($rota[0] ?? '') === 'comentarios') {
    header('Content-Type: application/json; charset=utf-8');

    // GET /comentarios/listar/{bibliotecaId}/{usuarioId}
    if ($method === 'GET' && ($rota[1] ?? '') === 'listar' && isset($ruta[2]) === false) { /* compat old */ }
    if ($method === 'GET' && ($rota[1] ?? '') === 'listar' && isset($rota[2], $rota[3])) {
        $bib = (int)$rota[2];
        $uid = (int)$rota[3];

        $all = __c_read_all($__c_store_file);
        // por enquanto retorna todos os comentários desse item da biblioteca (independente do usuário)
        $list = array_values(array_filter($all, function($r) use ($bib) {
            return (int)($r['biblioteca_id'] ?? 0) === $bib;
        }));

        echo json_encode(['sucesso'=>true, 'comentarios'=>$list], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /comentarios/criar
    if ($method === 'POST' && ($rota[1] ?? '') === 'criar') {
        $raw = file_get_contents('php://input');
        $in  = json_decode($raw, true) ?: [];

        $bib   = (int)($in['biblioteca_id'] ?? 0);
        $uid   = (int)($in['usuario_id'] ?? 0);
        $texto = trim((string)($in['texto'] ?? ''));

        if ($bib <= 0 || $uid <= 0 || $texto === '') {
            http_response_code(400);
            echo json_encode(['sucesso'=>false, 'erro'=>'Parâmetros inválidos']);
            exit;
        }

        $all = __c_read_all($__c_store_file);
        $id  = (string)(time() . rand(100,999));
        $row = [
            'id'            => $id,
            'biblioteca_id' => $bib,
            'usuario_id'    => $uid,
            'nome'          => 'Você',
            'texto'         => $texto,
            'criado_em'     => date('c'),
        ];
        $all[] = $row;
        __c_write_all($__c_store_file, $all);

        echo json_encode(['sucesso'=>true, 'comentario'=>$row], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // DELETE /comentarios/{id}
    if ($method === 'DELETE' && isset($rota[1]) && ctype_digit((string)$rota[1])) {
        $id  = (string)$rota[1];
        $all = __c_read_all($__c_store_file);
        $new = array_values(array_filter($all, fn($r) => (string)($r['id'] ?? '') !== $id));
        __c_write_all($__c_store_file, $new);

        echo json_encode(['sucesso'=>true]);
        exit;
    }

    // Se caiu aqui, rota não reconhecida
    http_response_code(404);
    echo json_encode(['sucesso'=>false, 'erro'=>'Rota de comentários não encontrada']);
    exit;
}
