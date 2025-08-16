<?php
// backend/routes/senha.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$parametros = $GLOBALS['rotas_parametros'] ?? [];
$acao = strtolower($parametros[0] ?? '');

function __senha_pdo(): PDO {
  if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) return $GLOBALS['pdo'];
  foreach ([__DIR__.'/../database.php', __DIR__.'/../db.php', __DIR__.'/../config.php', __DIR__.'/../config/conexao.php'] as $f) {
    if (is_file($f)) {
      include_once $f;
      if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) return $GLOBALS['pdo'];
      if (function_exists('getPDO'))   { $pdo = getPDO();   if ($pdo instanceof PDO) return $pdo; }
      if (function_exists('conectar')) { $pdo = conectar(); if ($pdo instanceof PDO) return $pdo; }
    }
  }
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
  return $pdo;
}
function __json_input(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}

$pdo = __senha_pdo();

/* Tabela de reset (tolerante) */
$pdo->exec("
CREATE TABLE IF NOT EXISTS tokens_reset (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NULL,
  email       VARCHAR(190) NULL,
  token       VARCHAR(64)  NOT NULL,
  codigo      CHAR(6)      NOT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em   DATETIME NULL,
  usado       TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_token (token),
  UNIQUE KEY uq_codigo (codigo),
  KEY idx_usuario (usuario_id),
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

/* Algumas instalações antigas podem não ter a coluna email */
try { $pdo->exec("ALTER TABLE tokens_reset ADD COLUMN email VARCHAR(190) NULL"); } catch (Throwable $e) {}

switch ($acao) {
  /* ========== PASSO 1: solicitar recuperação ========== */
  case 'recuperar': {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['erro'=>'Método não permitido']); exit; }
    $in = __json_input();
    $email = strtolower(trim((string)($in['email'] ?? '')));
    if ($email === '') { http_response_code(400); echo json_encode(['erro'=>'Email é obrigatório']); exit; }

    // Procura usuário (se existir)
    $user = null;
    foreach ([
      "SELECT id, email FROM usuarios WHERE LOWER(email)=:e LIMIT 1",
      "SELECT id, email FROM users    WHERE LOWER(email)=:e LIMIT 1",
    ] as $sql) {
      try {
        $st = $pdo->prepare($sql);
        $st->execute([':e' => $email]);
        $row = $st->fetch();
        if ($row) { $user = $row; break; }
      } catch (Throwable $e) {}
    }

    $token  = strtolower(bin2hex(random_bytes(16)));          // 32 hexdig
    $codigo = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Gravamos SEMPRE o pedido (com email); se não houver usuario_id agora,
    // na hora de redefinir procuramos pelo email.
    try {
      $st = $pdo->prepare("
        INSERT INTO tokens_reset (usuario_id, email, token, codigo, criado_em, expira_em, usado)
        VALUES (:uid, :em, :tok, :cod, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 0)
      ");
      $st->execute([
        ':uid' => $user['id'] ?? null,
        ':em'  => $email,
        ':tok' => $token,
        ':cod' => $codigo,
      ]);
    } catch (Throwable $e) {
      // se colidir UNIQUE, ignora e segue com a resposta
    }

    // Mensagem genérica (não revela existência do email)
    echo json_encode([
      'mensagem' => 'Se existir uma conta com esse e-mail, enviámos as instruções para redefinir a palavra-passe.',
      // Em DEV você ainda pode ver nos DevTools:
      'token_dev'  => $token,
      'codigo_dev' => $codigo,
    ]);
    exit;
  }

  /* ========== PASSO 2: redefinir ========== */
  case 'redefinir': {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['erro'=>'Método não permitido']); exit; }
    $in     = __json_input();
    $token  = strtolower(trim((string)($in['token']  ?? '')));
    $codigo = trim((string)($in['codigo'] ?? ''));
    $nova   = (string)($in['nova_senha'] ?? ($in['senha'] ?? ($in['password'] ?? '')));

    if ($nova === '') { http_response_code(400); echo json_encode(['erro'=>'Nova palavra-passe é obrigatória']); exit; }
    if ($token === '' && $codigo === '') { http_response_code(400); echo json_encode(['erro'=>'Informe o código ou o token']); exit; }

    // Busca o pedido válido
    $row = null;
    try {
      if ($token !== '') {
        $st = $pdo->prepare("
          SELECT * FROM tokens_reset
           WHERE usado=0 AND token=:t
             AND (expira_em IS NULL OR expira_em>NOW())
           ORDER BY id DESC LIMIT 1
        ");
        $st->execute([':t' => $token]);
        $row = $st->fetch();
      } else {
        $st = $pdo->prepare("
          SELECT * FROM tokens_reset
           WHERE usado=0 AND codigo=:c
             AND (expira_em IS NULL OR expira_em>NOW())
           ORDER BY id DESC LIMIT 1
        ");
        $st->execute([':c' => $codigo]);
        $row = $st->fetch();
      }
    } catch (Throwable $e) {}

    if (!$row) { http_response_code(400); echo json_encode(['erro'=>'Token/código inválido ou expirado']); exit; }

    // Descobre o usuário para atualizar
    $uid = (int)($row['usuario_id'] ?? 0);
    $email = strtolower(trim((string)($row['email'] ?? '')));

    if ($uid <= 0 && $email !== '') {
      foreach ([
        "SELECT id FROM usuarios WHERE LOWER(email)=:e LIMIT 1",
        "SELECT id FROM users    WHERE LOWER(email)=:e LIMIT 1",
      ] as $sql) {
        try {
          $st = $pdo->prepare($sql);
          $st->execute([':e' => $email]);
          $u = $st->fetch();
          if ($u) { $uid = (int)$u['id']; break; }
        } catch (Throwable $e) {}
      }
    }

    if ($uid <= 0) { http_response_code(400); echo json_encode(['erro'=>'Conta não encontrada para este pedido de recuperação']); exit; }

    $hash = password_hash($nova, PASSWORD_DEFAULT);

    // Atualiza senha (tenta nas duas tabelas)
    $ok = false;
    foreach ([
      "UPDATE usuarios SET senha=:h WHERE id=:id",
      "UPDATE users    SET password=:h WHERE id=:id",
    ] as $sql) {
      try {
        $st = $pdo->prepare($sql);
        $st->execute([':h'=>$hash, ':id'=>$uid]);
        $ok = true; break;
      } catch (Throwable $e) {}
    }
    if (!$ok) { http_response_code(500); echo json_encode(['erro'=>'Não foi possível atualizar a palavra-passe']); exit; }

    // Marca como usado e limpa expirados do mesmo email/usuário
    try {
      $pdo->beginTransaction();
      $st = $pdo->prepare("UPDATE tokens_reset SET usado=1 WHERE id=:id");
      $st->execute([':id' => $row['id']]);

      if ($uid > 0) {
        $st = $pdo->prepare("DELETE FROM tokens_reset WHERE usuario_id=:u AND (expira_em IS NOT NULL AND expira_em<NOW())");
        $st->execute([':u' => $uid]);
      } elseif ($email !== '') {
        $st = $pdo->prepare("DELETE FROM tokens_reset WHERE email=:e AND (expira_em IS NOT NULL AND expira_em<NOW())");
        $st->execute([':e' => $email]);
      }
      $pdo->commit();
    } catch (Throwable $e) { try { $pdo->rollBack(); } catch (Throwable $e2) {} }

    echo json_encode(['mensagem' => 'Palavra-passe atualizada com sucesso.']);
    exit;
  }

  default:
    http_response_code(404);
    echo json_encode(['erro' => 'Ação inválida']);
    exit;
}
