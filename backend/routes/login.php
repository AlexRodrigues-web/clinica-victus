<?php
// backend/routes/login.php

// CORS igual ao index (mas tolerante a dev)
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: {$origin}");
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Pré-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

error_log("routes/login.php acessada");

// Lê JSON ou form
$raw   = file_get_contents('php://input');
$dados = json_decode($raw, true);
if (!is_array($dados) || empty($dados)) $dados = $_POST ?: [];

$email = trim($dados['email'] ?? '');
$senha = (string)($dados['senha'] ?? $dados['password'] ?? '');

if ($email === '' || $senha === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Email e senha são obrigatórios'], JSON_UNESCAPED_UNICODE);
    exit;
}

function responder_ok(array $usuario, ?string $token = null, int $expira = 3600): void {
    if (!$token) $token = bin2hex(random_bytes(16));
    http_response_code(200);
    echo json_encode([
        'usuario' => [
            'id'    => (int)($usuario['id'] ?? 0),
            'nome'  => $usuario['nome'] ?? $usuario['nome_completo'] ?? $usuario['name'] ?? 'Usuário',
            'email' => $usuario['email'] ?? null,
        ],
        'token' => $token,
        'expira_em' => $expira
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* 1) Tenta o LoginController, mas AGORA:
 *    - Se vier usuário sem token => sucesso mesmo assim (geramos token)
 */
$controller_path = __DIR__ . '/../controllers/LoginController.php';
if (is_file($controller_path)) {
    require_once $controller_path;
    if (class_exists('LoginController')) {
        try {
            $ctrl = new LoginController();
            $resp = $ctrl->autenticar(['email' => $email, 'senha' => $senha]);

            if (is_array($resp)) {
                if (isset($resp['erro'])) {
                    error_log("login.php - Controller retornou erro: ".$resp['erro']);
                    // cai pro fallback DB
                } else {
                    $usuario = $resp['usuario'] ?? $resp['user'] ?? $resp['data'] ?? null;
                    if (!$usuario && isset($resp['id'])) $usuario = $resp; // alguns retornam direto os campos
                    $token = $resp['token'] ?? $resp['jwt'] ?? $resp['access_token'] ?? null;
                    $exp   = (int)($resp['expira_em'] ?? $resp['expires_in'] ?? 3600);
                    if (is_array($usuario)) responder_ok($usuario, $token, $exp);
                }
            }
        } catch (Throwable $e) {
            error_log("login.php - Exceção no LoginController: ".$e->getMessage());
        }
    }
}

/* 2) Fallback direto no DB:
 *    - Descobre se a tabela `usuarios` existe
 *    - Lê colunas dinamicamente (senha_hash, senha, password_hash, password...)
 *    - Se hash, usa password_verify; senão compara texto puro
 *    - Se não existir a tabela, modo DEV: loga com qualquer senha (somente localhost)
 */
try {
    // tenta reaproveitar conexão de outros arquivos se existirem
    $pdo = null;
    foreach ([__DIR__ . '/../db.php', __DIR__ . '/../config/db.php', __DIR__ . '/../config.php'] as $c) {
        if (is_file($c)) require_once $c;
    }
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        $dsn  = 'mysql:host=localhost;dbname=clinica_victus;charset=utf8mb4';
        $user = 'root';
        $pass = '';
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    // tabela existe?
    $tableExists = false;
    $check = $pdo->prepare("SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'usuarios' LIMIT 1");
    $check->execute();
    $tableExists = (bool)$check->fetchColumn();

    // Se não existe usuarios => MODO DEV (localhost): aceita qualquer senha
    $isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1', ['127.0.0.1','::1']) || (php_sapi_name() === 'cli-server');
    if (!$tableExists) {
        error_log("login.php - Tabela 'usuarios' não existe. MODO DEV ON.");
        if ($isLocal) {
            responder_ok(['id' => 1, 'nome' => 'Dev User', 'email' => $email]);
        } else {
            http_response_code(401);
            echo json_encode(['erro' => 'Autenticação indisponível'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Descobre colunas
    $colsStmt = $pdo->query("DESCRIBE usuarios");
    $cols = $colsStmt->fetchAll();
    $colnames = array_map(fn($r) => $r['Field'], $cols);

    // mapeia possíveis colunas
    $idCol    = in_array('id', $colnames) ? 'id' : (in_array('usuario_id',$colnames)?'usuario_id':'id');
    $nomeCol  = in_array('nome', $colnames) ? 'nome' :
                (in_array('nome_completo',$colnames)?'nome_completo' :
                (in_array('name',$colnames)?'name':'nome'));
    $emailCol = in_array('email', $colnames) ? 'email' :
                (in_array('login',$colnames)?'login': 'email');

    $passCols = array_values(array_intersect(
        $colnames,
        ['senha_hash','password_hash','senha','password','pass','hash']
    ));
    // Se nenhuma coluna de senha conhecida, tratamos como modo DEV local
    if (empty($passCols) && $isLocal) {
        error_log("login.php - Nenhuma coluna de senha na tabela. MODO DEV ON.");
        // pega qualquer registro com esse email, se existir
        $stmt = $pdo->prepare("SELECT {$idCol} AS id, {$nomeCol} AS nome, {$emailCol} AS email FROM usuarios WHERE {$emailCol} = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch() ?: ['id'=>1,'nome'=>'Dev User','email'=>$email];
        responder_ok($user);
    }

    // Monta SELECT dinâmico
    $selectCols = "{$idCol} AS id, {$nomeCol} AS nome, {$emailCol} AS email";
    foreach ($passCols as $pc) $selectCols .= ", {$pc}";
    $sql = "SELECT {$selectCols} FROM usuarios WHERE {$emailCol} = :email LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    $u = $stmt->fetch();

    if (!$u) {
        error_log("login.php - email não encontrado: {$email}");
        http_response_code(401);
        echo json_encode(['erro' => 'Credenciais inválidas'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Valida senha contra a primeira coluna válida
    $ok = false;
    foreach ($passCols as $pc) {
        if (!array_key_exists($pc, $u)) continue;
        $stored = (string)$u[$pc];
        if ($stored === '') continue;

        // hash conhecido?
        if (preg_match('/^\$2y\$/', $stored) || preg_match('/^\$argon2/i', $stored)) {
            if (password_verify($senha, $stored)) { $ok = true; break; }
        } else {
            // texto puro (dev/legado)
            if (hash_equals($stored, $senha)) { $ok = true; break; }
        }
    }

    // Se não achou coluna de senha mas estamos em localhost, aceita (DEV)
    if (!$ok && empty($passCols) && $isLocal) {
        $ok = true;
    }

    if (!$ok) {
        error_log("login.php - senha inválida para {$email}");
        http_response_code(401);
        echo json_encode(['erro' => 'Credenciais inválidas'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    responder_ok($u);

} catch (Throwable $e) {
    error_log("login.php - ERRO fallback DB: ".$e->getMessage());
    // Em DEV, não travar fluxo
    $isLocal = in_array($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1', ['127.0.0.1','::1']) || (php_sapi_name() === 'cli-server');
    if ($isLocal) {
        responder_ok(['id'=>1,'nome'=>'Dev User','email'=>$email]);
    }
    http_response_code(401);
    echo json_encode(['erro' => 'Não foi possível autenticar'], JSON_UNESCAPED_UNICODE);
    exit;
}
