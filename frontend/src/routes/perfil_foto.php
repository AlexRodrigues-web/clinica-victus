<?php
require '../config/conexao.php'; // ajuste conforme necessário
require '../auth/validar_token.php'; // se usa autenticação

header('Content-Type: application/json');

// Verifica método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

// Verifica se recebeu arquivo
if (!isset($_FILES['foto_perfil']) || $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['erro' => 'Arquivo inválido']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'] ?? null;
if (!$usuario_id) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

// Pasta onde a imagem será salva
$pasta = '../uploads/fotos/';
if (!file_exists($pasta)) {
    mkdir($pasta, 0777, true);
}

$ext = pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION);
$nomeUnico = 'perfil_' . $usuario_id . '_' . time() . '.' . $ext;
$caminhoFinal = $pasta . $nomeUnico;

if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $caminhoFinal)) {
    // Salva caminho no banco
    $urlRelativa = 'uploads/fotos/' . $nomeUnico;

    $pdo = conectar(); // sua função de conexão
    $stmt = $pdo->prepare("UPDATE usuarios SET foto_perfil = ? WHERE id = ?");
    $stmt->execute([$urlRelativa, $usuario_id]);

    echo json_encode(['foto_perfil' => $urlRelativa]);
    exit;
} else {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao mover arquivo']);
    exit;
}
