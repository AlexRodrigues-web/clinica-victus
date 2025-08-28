<?php
// backend/routes/perfil.php
// ⚠️ Arquivo standalone, sem funções globais (json_ok/json_bad/etc.)

// Evita warnings de CORS duplicados; mas não faz mal repetir.
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header("Vary: Origin");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Pré-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Aceita só GET e PUT e POST (foto)
$method = $_SERVER['REQUEST_METHOD'];
$acao   = $_REQUEST['acao'] ?? null;

// ------ util local: token Bearer ------
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? '');
$bearer = null;
if ($authHeader && stripos($authHeader, 'Bearer ') === 0) {
    $bearer = trim(substr($authHeader, 7));
}
if (!$bearer) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autorizado (token ausente)']);
    exit;
}

// ------ obter PDO do projeto sem declarar funções globais ------
$pdo = null;
try {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
        $pdo = $GLOBALS['pdo'];
    } else {
        // tentar includes já existentes
        foreach ([__DIR__.'/../database.php', __DIR__.'/../db.php', __DIR__.'/../config.php', __DIR__.'/../config/conexao.php'] as $f) {
            if (is_file($f)) {
                include_once $f;
                if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) { $pdo = $GLOBALS['pdo']; break; }
                if (function_exists('getPDO'))   { $tmp = getPDO();   if ($tmp instanceof PDO) { $pdo = $tmp; break; } }
                if (function_exists('conectar')){ $tmp = conectar(); if ($tmp instanceof PDO) { $pdo = $tmp; break; } }
            }
        }
        if (!$pdo) {
            // fallback direto
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $db   = getenv('DB_NAME') ?: 'clinica_victus';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';
            $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";
            $pdo  = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $pdo->exec("SET NAMES utf8mb4");
        }
    }
} catch (Throwable $e) {
    error_log("perfil.php PDO erro: ".$e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Falha de conexão']);
    exit;
}

// Garante tabela de tokens (sem FK p/ evitar erro 150)
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tokens_auth (
          token      CHAR(32) PRIMARY KEY,
          usuario_id INT NOT NULL,
          criado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expira_em  DATETIME NULL,
          INDEX (usuario_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (Throwable $e) {
    // segue sem quebrar — login já deve ter criado
}

// Resolve usuário a partir do token
try {
    $sql = "
        SELECT u.id, u.nome, u.email, u.nivel, u.dt_registro, u.foto_perfil
        FROM usuarios u
        JOIN tokens_auth t ON t.usuario_id = u.id
        WHERE t.token = :t
          AND (t.expira_em IS NULL OR t.expira_em > NOW())
        LIMIT 1
    ";
    $st = $pdo->prepare($sql);
    $st->execute([':t' => $bearer]);
    $usuario = $st->fetch();
    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['erro' => 'Não autorizado']);
        exit;
    }
} catch (Throwable $e) {
    error_log("perfil.php SELECT erro: ".$e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao carregar perfil']);
    exit;
}

// === ROTAS ===

// GET /perfil  -> devolve os dados
if ($method === 'GET' && $acao === null) {
    $resp = [
        'id'          => (int)$usuario['id'],
        'nome'        => $usuario['nome'] ?: ucfirst(strtok($usuario['email'], '@')),
        'email'       => $usuario['email'],
        'nivel'       => $usuario['nivel'] ?? null,
        'dt_registro' => $usuario['dt_registro'] ?? null,
        'foto_perfil' => $usuario['foto_perfil'] ?? null,
        'avatar'      => $usuario['foto_perfil'] ?? null,
    ];
    http_response_code(200);
    echo json_encode(['usuario' => $resp], JSON_UNESCAPED_UNICODE);
    exit;
}

// PUT /perfil  -> atualiza nome/email
if ($method === 'PUT' && $acao === null) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['erro' => 'JSON inválido']);
        exit;
    }
    $permitidos = ['nome', 'email'];
    $sets = []; $vals = [];
    foreach ($permitidos as $f) {
        if (array_key_exists($f, $input)) {
            $sets[] = "`$f` = ?";
            $vals[] = $input[$f];
        }
    }
    if (!$sets) {
        http_response_code(400);
        echo json_encode(['erro' => 'Nenhum campo permitido enviado']);
        exit;
    }
    $vals[] = (int)$usuario['id'];
    $sqlUp = "UPDATE usuarios SET ".implode(', ', $sets)." WHERE id = ?";
    $stmt  = $pdo->prepare($sqlUp);
    $stmt->execute($vals);

    http_response_code(200);
    echo json_encode(['sucesso' => true]);
    exit;
}

// POST /perfil?acao=foto  -> upload de foto
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
    $novoNome      = "perfil_{$usuario['id']}_" . time() . "." . $ext;
    $pastaDestino  = __DIR__ . "/../uploads/fotos/";
    if (!is_dir($pastaDestino)) mkdir($pastaDestino, 0777, true);
    $caminhoFisico = $pastaDestino . $novoNome;
    $urlRelativa   = "uploads/fotos/{$novoNome}";

    if (!move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $caminhoFisico)) {
        http_response_code(500);
        echo json_encode(['erro' => 'Falha ao mover arquivo']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE usuarios SET foto_perfil = ? WHERE id = ?");
    $stmt->execute([$urlRelativa, (int)$usuario['id']]);

    http_response_code(200);
    echo json_encode(['foto_perfil' => $urlRelativa]);
    exit;
}

http_response_code(404);
echo json_encode(['erro' => 'Rota não encontrada']);
