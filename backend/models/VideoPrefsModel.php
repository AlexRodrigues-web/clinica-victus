<?php
// backend/models/VideoPrefsModel.php
require_once __DIR__ . '/../config/Conexao.php';

class VideoPrefsModel {
    private $pdo;

    public function __construct() {
        $this->pdo = Conexao::getConexao();
        $this->ensureTable();
    }

    /**
     * Cria a tabela usuario_video_prefs se ainda não existir.
     * Inclui UNIQUE (usuario_id, biblioteca_id) para permitir ON DUPLICATE KEY.
     */
    private function ensureTable(): void {
        try {
            $sql = "
                CREATE TABLE IF NOT EXISTS usuario_video_prefs (
                    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT UNSIGNED NOT NULL,
                    biblioteca_id INT UNSIGNED NOT NULL,
                    favorite  TINYINT(1) NOT NULL DEFAULT 0,
                    liked     TINYINT(1) NOT NULL DEFAULT 0,
                    completed TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uniq_user_bib (usuario_id, biblioteca_id),
                    KEY idx_bib (biblioteca_id),
                    CONSTRAINT fk_uvp_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    CONSTRAINT fk_uvp_bib  FOREIGN KEY (biblioteca_id) REFERENCES biblioteca(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
                  DEFAULT CHARSET=utf8mb4
                  COLLATE=utf8mb4_unicode_ci;
            ";
            $this->pdo->exec($sql);
        } catch (\Throwable $e) {
            // Se FK falhar (ordem de criação ou permissões), loga e segue com a vida.
            error_log('[VideoPrefsModel::ensureTable] aviso: ' . $e->getMessage());
        }
    }

    public function get(int $bibliotecaId, int $usuarioId): array {
        $sql = "SELECT favorite, liked, completed
                  FROM usuario_video_prefs
                 WHERE biblioteca_id = :bib AND usuario_id = :uid
                 LIMIT 1";
        $st = $this->pdo->prepare($sql);
        $st->execute([':bib' => $bibliotecaId, ':uid' => $usuarioId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return ['favorite' => 0, 'liked' => 0, 'completed' => 0];
        }
        return [
            'favorite'  => !empty($row['favorite'])  ? 1 : 0,
            'liked'     => !empty($row['liked'])     ? 1 : 0,
            'completed' => !empty($row['completed']) ? 1 : 0,
        ];
    }

    /**
     * Define/atualiza todas as flags de uma vez (upsert).
     * $prefs pode conter favorite/liked/completed (qualquer valor truthy vira 1).
     */
    public function upsert(int $bibliotecaId, int $usuarioId, array $prefs): array {
        $favorite  = !empty($prefs['favorite'])  ? 1 : 0;
        $liked     = !empty($prefs['liked'])     ? 1 : 0;
        $completed = !empty($prefs['completed']) ? 1 : 0;

        $sql = "INSERT INTO usuario_video_prefs (usuario_id, biblioteca_id, favorite, liked, completed)
                VALUES (:uid, :bib, :fav, :lik, :cmp)
                ON DUPLICATE KEY UPDATE
                    favorite = VALUES(favorite),
                    liked    = VALUES(liked),
                    completed= VALUES(completed)";
        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':uid' => $usuarioId,
            ':bib' => $bibliotecaId,
            ':fav' => $favorite,
            ':lik' => $liked,
            ':cmp' => $completed
        ]);

        return ['favorite' => $favorite, 'liked' => $liked, 'completed' => $completed];
    }

    /**
     * Atualização parcial (patch). Só altera as chaves presentes em $patch.
     */
    public function patch(int $bibliotecaId, int $usuarioId, array $patch): array {
        $cur = $this->get($bibliotecaId, $usuarioId);

        $new = [
            'favorite'  => array_key_exists('favorite',  $patch) ? (int)!!$patch['favorite']  : $cur['favorite'],
            'liked'     => array_key_exists('liked',     $patch) ? (int)!!$patch['liked']     : $cur['liked'],
            'completed' => array_key_exists('completed', $patch) ? (int)!!$patch['completed'] : $cur['completed'],
        ];

        return $this->upsert($bibliotecaId, $usuarioId, $new);
    }
}
