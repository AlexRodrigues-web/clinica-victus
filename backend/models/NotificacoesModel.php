<?php
// models/NotificacoesModel.php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

class NotificacoesModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
        // Segurança padrão
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }

    // Conta por tipo considerando globais (usuario_id IS NULL) + do usuário
    public function contarPorTipo(int $usuarioId, string $tipo): int
    {
        $sql = "SELECT COUNT(*) AS total
                  FROM notificacoes
                 WHERE tipo = :tipo
                   AND (usuario_id = :uid OR usuario_id IS NULL)";
        $st = $this->db->prepare($sql);
        $st->execute([':tipo' => $tipo, ':uid' => $usuarioId]);
        return (int)$st->fetchColumn();
    }

    // Lista por tipo. Se $tipo for vazio, lista todos os tipos.
    public function listar(int $usuarioId, string $tipo, int $limit): array
    {
        $tipo = in_array($tipo, ['grupo','alerta','evento']) ? $tipo : '';
        $limit = max(1, min(200, (int)$limit));

        if ($tipo !== '') {
            $sql = "SELECT id, titulo, mensagem, tipo, data, criado_em
                      FROM notificacoes
                     WHERE (usuario_id = :uid OR usuario_id IS NULL)
                       AND tipo = :tipo
                  ORDER BY COALESCE(data, criado_em, NOW()) DESC
                     LIMIT {$limit}";
            $st = $this->db->prepare($sql);
            $st->execute([':uid' => $usuarioId, ':tipo' => $tipo]);
        } else {
            $sql = "SELECT id, titulo, mensagem, tipo, data, criado_em
                      FROM notificacoes
                     WHERE (usuario_id = :uid OR usuario_id IS NULL)
                  ORDER BY COALESCE(data, criado_em, NOW()) DESC
                     LIMIT {$limit}";
            $st = $this->db->prepare($sql);
            $st->execute([':uid' => $usuarioId]);
        }

        $rows = $st->fetchAll();
        return array_map(function($r){
            if (empty($r['titulo']) && !empty($r['mensagem'])) {
                $r['titulo'] = $r['mensagem'];
            }
            return $r;
        }, $rows);
    }

    // Próximos eventos (tipo = 'evento'), incluindo globais
    public function proximosEventos(int $usuarioId, int $limit): array
    {
        $limit = max(1, min(50, (int)$limit));

        // Se houver coluna data, filtra por hoje pra frente; se não houver, apenas ordena por criado_em
        $temData = true;
        try {
            $this->db->query("SELECT data FROM notificacoes LIMIT 0");
        } catch (Throwable $e) {
            $temData = false;
        }

        if ($temData) {
            $sql = "SELECT id, titulo, mensagem, tipo, data, criado_em
                      FROM notificacoes
                     WHERE (usuario_id = :uid OR usuario_id IS NULL)
                       AND tipo = 'evento'
                       AND (data IS NULL OR DATE(data) >= CURDATE())
                  ORDER BY COALESCE(data, NOW()) ASC
                     LIMIT {$limit}";
        } else {
            $sql = "SELECT id, titulo, mensagem, tipo, NULL as data, criado_em
                      FROM notificacoes
                     WHERE (usuario_id = :uid OR usuario_id IS NULL)
                       AND tipo = 'evento'
                  ORDER BY criado_em ASC
                     LIMIT {$limit}";
        }

        $st = $this->db->prepare($sql);
        $st->execute([':uid' => $usuarioId]);
        return $st->fetchAll();
    }
}
