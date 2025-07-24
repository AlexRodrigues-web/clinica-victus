<?php
// backend/routes/perfil.php

// --- CORS & JSON headers ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- includes ---
require_once __DIR__ . '/../config/conexao.php';
require_once __DIR__ . '/../helpers/validar_token.php';

// --- autenticação via token ---
$usuario_id = validar_token();
if (!$usuario_id) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$acao   = $_REQUEST['acao'] ?? null;

$pdo = conectar();

// --------------------------
// GET /?rota=perfil
// --------------------------
if ($method === 'GET' && $acao === null) {
    $sql = "
        SELECT
            u.nome,
            u.genero,
            u.data_nascimento,
            u.telefone,
            u.endereco,
            u.email,
            u.dt_registro,
            u.foto_perfil,
            JSON_OBJECT(
                'nome', p.nome,
                'objetivo', p.objetivo,
                'duracao', p.duracao,
                'progresso', u.plano_progresso
            ) AS plano,
            JSON_OBJECT(
                'notificacoes', u.notificacoes,
                'idioma', u.idioma
            ) AS config
        FROM usuarios u
        LEFT JOIN planos p ON p.id = u.plano_id
        WHERE u.id = ?
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$usuario) {
        http_response_code(404);
        echo json_encode(['erro' => 'Usuário não encontrado']);
        exit;
    }
    $usuario['plano']  = json_decode($usuario['plano'],  true);
    $usuario['config'] = json_decode($usuario['config'], true);
    echo json_encode($usuario);
    exit;
}

// --------------------------
// PUT /?rota=perfil
// --------------------------
if ($method === 'PUT' && $acao === null) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['erro' => 'JSON inválido']);
        exit;
    }
    $permitidos = [
        'nome','genero','data_nascimento',
        'telefone','endereco','email',
        'notificacoes','idioma'
    ];
    $campos = $valores = [];
    foreach ($permitidos as $f) {
        if (array_key_exists($f, $input)) {
            $campos[]  = "`$f` = ?";
            $valores[] = $input[$f];
        }
    }
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['erro' => 'Nenhum campo permitido enviado']);
        exit;
    }
    $valores[] = $usuario_id;
    $sql = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($valores);
    echo json_encode(['sucesso' => true]);
    exit;
}

// --------------------------
// POST /?rota=perfil&acao=foto
// --------------------------
if ($method === 'POST' && $acao === 'foto') {
    if (
        !isset($_FILES['foto_perfil']) ||
        $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK
    ) {
        http_response_code(400);
        echo json_encode(['erro' => 'Erro ao receber a imagem']);
        exit;
    }
    $ext = pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION);
    $novoNome      = "perfil_{$usuario_id}_" . time() . ".$ext";
    $pastaDestino  = __DIR__ . "/../uploads/fotos/";
    if (!file_exists($pastaDestino)) mkdir($pastaDestino, 0777, true);
    $caminhoFisico = $pastaDestino . $novoNome;
    $urlRelativa   = "uploads/fotos/{$novoNome}";
    if (!move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $caminhoFisico)) {
        http_response_code(500);
        echo json_encode(['erro' => 'Falha ao mover arquivo']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE usuarios SET foto_perfil = ? WHERE id = ?");
    $stmt->execute([$urlRelativa, $usuario_id]);
    echo json_encode(['foto_perfil' => $urlRelativa]);
    exit;
}

// --------------------------
// Rota não encontrada
// --------------------------
http_response_code(404);
echo json_encode(['erro' => 'Rota não encontrada']);
