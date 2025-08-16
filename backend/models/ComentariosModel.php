<?php
// backend/controllers/ComentariosController.php
class ComentariosController {
    private $pdo;

    public function __construct() {
        $this->pdo = self::getPDO();
    }

    private static function getPDO() {
        if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
            return $GLOBALS['pdo'];
        }
        foreach ([
            __DIR__ . '/../database.php',
            __DIR__ . '/../db.php',
            __DIR__ . '/../config.php'
        ] as $f) {
            if (is_file($f)) {
                require_once $f;
                if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
                    return $GLOBALS['pdo'];
                }
                if (function_exists('getPDO')) {
                    return getPDO();
                }
            }
        }
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

    /** GET /comentarios/listar/{usuarioId}?limit=20  */
    public function listar(int $usuarioId) {
        $uid   = max(0, (int)$usuarioId);
        $limit = (int)($_GET['limit'] ?? 20);
        $limit = max(1, min(100, $limit));

        // Lê da VIEW `comentarios` (tipo='mensagem')
        $sql = "SELECT id,
                       usuario_id,
                       titulo,
                       COALESCE(conteudo, mensagem) AS conteudo,
                       COALESCE(criado_em, `data`, created_at) AS criado_em
                  FROM comentarios
                 WHERE (:uid = 0 OR usuario_id = :uid OR usuario_id IS NULL)
              ORDER BY COALESCE(criado_em, `data`, created_at) DESC
                 LIMIT {$limit}";
        $st = $this->pdo->prepare($sql);
        $st->execute([':uid' => $uid]);
        echo json_encode($st->fetchAll());
    }

    /** GET /comentarios/contagens/{usuarioId}  (útil para badgets no painel) */
    public function contagens(int $usuarioId) {
        $uid = max(0, (int)$usuarioId);
        $sql = "SELECT COUNT(*) AS total
                  FROM comentarios
                 WHERE (:uid = 0 OR usuario_id = :uid OR usuario_id IS NULL)";
        $st = $this->pdo->prepare($sql);
        $st->execute([':uid' => $uid]);
        $total = (int)$st->fetchColumn();
        echo json_encode(['mensagens' => $total, 'total' => $total]);
    }
}
