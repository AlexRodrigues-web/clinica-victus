<?php
// backend/controllers/LoginController.php

class LoginController {
    private $pdo;

    public function __construct() {
        $this->pdo = self::getPDO();
    }

    /* =========================
     * Conexão PDO (reusa se existir)
     * ========================= */
    private static function getPDO() {
        if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
            return $GLOBALS['pdo'];
        }

        // tenta includes já existentes no projeto
        foreach ([__DIR__.'/../database.php', __DIR__.'/../db.php', __DIR__.'/../config.php', __DIR__.'/../config/conexao.php'] as $f) {
            if (is_file($f)) {
                include_once $f;
                if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) return $GLOBALS['pdo'];
                if (function_exists('getPDO'))    return getPDO();
                if (function_exists('conectar'))  return conectar();
            }
        }

        // fallback local (envs ou defaults)
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $db   = getenv('DB_NAME') ?: 'clinica_victus';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec("SET NAMES utf8mb4");
        return $pdo;
    }

    /* =========================
     * Endpoint de autenticação
     * ========================= */
    public function autenticar(array $dados): array {
        $email = strtolower(trim((string)($dados['email'] ?? '')));
        $senha = (string)($dados['senha'] ?? '');

        if ($email === '' || $senha === '') {
            return ['erro' => 'Email e senha são obrigatórios.'];
        }

        // SOMENTE tabela `usuarios`
        $user = $this->findUsuarioByEmail($email);
        if (!$user) {
            return ['erro' => 'Credenciais inválidas.'];
        }

        $hash = (string)($user['senha'] ?? '');
        if (!$this->checkPassword($senha, $hash)) {
            return ['erro' => 'Credenciais inválidas.'];
        }

        // garante tabela de tokens e grava novo token (expira em 30 dias)
        $this->ensureTokensTable();
        $token = $this->criarTokenParaUsuario((int)$user['id'], 30);

        // normaliza campos do usuário para o front
        $usuario = $this->formatUsuario($user);

        return [
            'usuario' => $usuario,
            'token'   => $token,
        ];
    }

    /* =========================
     * Utilidades de usuário
     * ========================= */
    private function findUsuarioByEmail(string $email): ?array {
        $sql = "
            SELECT
                id,
                nome,
                email,
                senha,
                foto_perfil
            FROM usuarios
            WHERE LOWER(email) = :email
            LIMIT 1
        ";
        try {
            $st = $this->pdo->prepare($sql);
            $st->execute([':email' => $email]);
            $row = $st->fetch();
            return $row ?: null;
        } catch (Throwable $e) {
            error_log("LoginController::findUsuarioByEmail falhou: ".$e->getMessage());
            return null;
        }
    }

    private function checkPassword(string $plain, string $stored): bool {
        if ($stored === '') return false;

        // bcrypt/argon2
        if (preg_match('/^\$2y\$/', $stored) || preg_match('/^\$argon2/i', $stored)) {
            return password_verify($plain, $stored);
        }

        // MD5 em texto (32 hexdigits)
        if (preg_match('/^[a-f0-9]{32}$/i', $stored)) {
            return hash_equals(strtolower($stored), md5($plain));
        }

        // texto puro (legado)
        return hash_equals($stored, $plain);
    }

    private function formatUsuario(array $u): array {
        $nome = $u['nome'] ?? '';
        if ($nome === '' && !empty($u['email'])) {
            $nome = ucfirst(strtok($u['email'], '@'));
        }

        // usa foto_perfil como avatar (se existir)
        $avatar = !empty($u['foto_perfil']) ? $u['foto_perfil'] : null;

        return [
            'id'     => (int)$u['id'],
            'nome'   => $nome,
            'email'  => $u['email'],
            'avatar' => $avatar,
        ];
    }

    /* =========================
     * Tokens (armazenamento)
     * ========================= */
    private function ensureTokensTable(): void {
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS tokens_auth (
                  token      CHAR(32) PRIMARY KEY,
                  usuario_id INT NOT NULL,
                  criado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  expira_em  DATETIME NULL,
                  INDEX (usuario_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
        } catch (Throwable $e) {
            error_log('ensureTokensTable erro: '.$e->getMessage());
        }
    }

    private function criarTokenParaUsuario(int $usuarioId, int $diasValidade = 30): string {
        $token = bin2hex(random_bytes(16)); // 32 chars

        // remove tokens antigos (opcional)
        try {
            $del = $this->pdo->prepare("DELETE FROM tokens_auth WHERE usuario_id = :u");
            $del->execute([':u' => $usuarioId]);
        } catch (Throwable $e) {
            error_log('limpeza de tokens falhou: '.$e->getMessage());
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO tokens_auth (token, usuario_id, criado_em, expira_em)
            VALUES (:t, :u, NOW(), DATE_ADD(NOW(), INTERVAL :d DAY))
        ");
        $stmt->execute([
            ':t' => $token,
            ':u' => $usuarioId,
            ':d' => $diasValidade,
        ]);

        // limpeza básica global (expirados)
        try {
            $this->pdo->exec("DELETE FROM tokens_auth WHERE expira_em IS NOT NULL AND expira_em < NOW()");
        } catch (Throwable $e) {
            // ignora
        }

        return $token;
    }
}
