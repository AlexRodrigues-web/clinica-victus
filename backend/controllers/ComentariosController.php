<?php
// backend/controllers/ComentariosController.php
class ComentariosController
{
    private function db(): PDO {
        static $pdo = null;
        if ($pdo) return $pdo;
        $pdo = new PDO("mysql:host=localhost;dbname=clinica_victus;charset=utf8mb4","root","",[
            PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    }
    private function out($data, int $code = 200){ http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

    // GET /comentarios/listar/{usuarioId}
    public function listar(int $usuarioId): void {
        try {
            $pdo   = $this->db();
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;

            // usa a view comentarios se existir; se não, cai em notificacoes.tipo='mensagem'
            $sql = "
                SELECT
                  n.id,
                  n.usuario_id,
                  n.titulo,
                  COALESCE(n.mensagem, n.corpo, n.texto, n.descricao, '') AS conteudo,
                  COALESCE(n.inicio, n.data, n.created_at) AS criado_em
                FROM notificacoes n
                WHERE n.tipo='mensagem'
                  AND ( :uid = 0 OR n.usuario_id = :uid OR n.usuario_id IS NULL )
                ORDER BY COALESCE(n.inicio, n.data, n.created_at) DESC
                LIMIT :limit
            ";
            $st = $pdo->prepare($sql);
            $st->bindValue(':uid',   (int)$usuarioId, PDO::PARAM_INT);
            $st->bindValue(':limit', (int)$limit,     PDO::PARAM_INT);
            $st->execute();
            $rows = $st->fetchAll() ?: [];

            $this->out(['itens' => $rows]);
        } catch (Throwable $e) {
            error_log("comentarios/listar erro: ".$e->getMessage());
            $this->out(['itens'=>[]]);
        }
    }

    // GET /comentarios/contagens/{usuarioId}
    public function contagens(int $usuarioId): void {
        try {
            $pdo = $this->db();
            $st = $pdo->prepare("
                SELECT COUNT(*) AS total
                FROM notificacoes
                WHERE tipo='mensagem'
                  AND ( :uid = 0 OR usuario_id = :uid OR usuario_id IS NULL )
            ");
            $st->execute([':uid'=>$usuarioId]);
            $row = $st->fetch() ?: ['total'=>0];
            $this->out($row);
        } catch (Throwable $e) {
            error_log("comentarios/contagens erro: ".$e->getMessage());
            $this->out(['total'=>0]);
        }
    }
}
