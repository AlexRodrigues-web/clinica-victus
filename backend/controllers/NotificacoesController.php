<?php
// backend/controllers/NotificacoesController.php
class NotificacoesController
{
    private function db(): PDO {
        static $pdo = null;
        if ($pdo) return $pdo;

        // Ajusta se teus credenciais forem outros
        $host = 'localhost';
        $db   = 'clinica_victus';
        $user = 'root';
        $pass = '';
        $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    }

    private function out($data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // GET /notificacoes/contagens/{usuarioId}
    public function contagens(int $usuarioId): void {
        try {
            $pdo = $this->db();

            // conta itens do usuário + globais (usuario_id IS NULL)
            $sql = "
                SELECT
                  SUM(CASE WHEN tipo='grupo'    THEN 1 ELSE 0 END) AS grupos,
                  SUM(CASE WHEN tipo='alerta'   THEN 1 ELSE 0 END) AS alertas,
                  SUM(CASE WHEN tipo='mensagem' THEN 1 ELSE 0 END) AS mensagens
                FROM notificacoes
                WHERE tipo IN ('grupo','alerta','mensagem')
                  AND ( :uid = 0 OR usuario_id = :uid OR usuario_id IS NULL )
            ";
            $st = $pdo->prepare($sql);
            $st->execute([':uid' => $usuarioId]);
            $row = $st->fetch() ?: ['grupos'=>0,'alertas'=>0,'mensagens'=>0];

            $this->out($row);
        } catch (Throwable $e) {
            error_log("contagens erro: ".$e->getMessage());
            $this->out(['grupos'=>0,'alertas'=>0,'mensagens'=>0]);
        }
    }

    // GET /notificacoes/listar/{usuarioId}?tipo=grupo|alerta|mensagem&limit=20
    public function listar(int $usuarioId): void {
        try {
            $pdo   = $this->db();
            $tipo  = isset($_GET['tipo']) ? strtolower(trim($_GET['tipo'])) : null;
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;

            $tiposPermitidos = ['grupo','alerta','mensagem','evento'];
            $bind = [':uid' => $usuarioId, ':limit' => $limit];

            $filtroTipo = '';
            if ($tipo && in_array($tipo, $tiposPermitidos, true)) {
                $filtroTipo = " AND tipo = :tipo ";
                $bind[':tipo'] = $tipo;
            }

            $sql = "
                SELECT
                  id,
                  usuario_id,
                  tipo,
                  titulo,
                  COALESCE(mensagem, corpo, texto, descricao, '') AS mensagem,
                  COALESCE(inicio, data, created_at) AS data,
                  DATE_FORMAT(COALESCE(inicio, data, created_at),'%d/%m') AS data_br,
                  local
                FROM notificacoes
                WHERE ( :uid = 0 OR usuario_id = :uid OR usuario_id IS NULL )
                  {$filtroTipo}
                ORDER BY COALESCE(inicio, data, created_at) DESC
                LIMIT :limit
            ";
            $st = $pdo->prepare($sql);
            // bind manual pra LIMIT
            foreach ($bind as $k=>$v) {
                $param = ($k === ':limit') ? PDO::PARAM_INT : PDO::PARAM_STR;
                if ($k === ':uid') $param = PDO::PARAM_INT;
                $st->bindValue($k, $v, $param);
            }
            $st->execute();
            $rows = $st->fetchAll() ?: [];

            $this->out(['itens' => $rows]);
        } catch (Throwable $e) {
            error_log("listar erro: ".$e->getMessage());
            $this->out(['itens' => []]);
        }
    }

    // GET /notificacoes/proximos/{usuarioId}  (também usado por /eventos/proximos/{usuarioId})
    public function proximosEventos(int $usuarioId): void {
        try {
            $pdo   = $this->db();
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 5;

            $sql = "
                SELECT
                  id,
                  usuario_id,
                  titulo,
                  COALESCE(descricao, mensagem, corpo, texto, '') AS descricao,
                  COALESCE(inicio, data, created_at) AS data,
                  DATE_FORMAT(COALESCE(inicio, data, created_at),'%d/%m') AS data_br,
                  local
                FROM notificacoes
                WHERE tipo = 'evento'
                  AND COALESCE(inicio, data, created_at) >= NOW()
                  AND ( :uid = 0 OR usuario_id = :uid OR usuario_id IS NULL )
                ORDER BY COALESCE(inicio, data, created_at) ASC
                LIMIT :limit
            ";
            $st = $pdo->prepare($sql);
            $st->bindValue(':uid',   (int)$usuarioId, PDO::PARAM_INT);
            $st->bindValue(':limit', (int)$limit,     PDO::PARAM_INT);
            $st->execute();
            $rows = $st->fetchAll() ?: [];

            // shape direto como array (teu pickArray aceita)
            $this->out($rows);
        } catch (Throwable $e) {
            error_log("proximosEventos erro: ".$e->getMessage());
            $this->out([]);
        }
    }
}
