<?php
// backend/models/AulasModel.php
require_once __DIR__ . '/../config/Conexao.php';

class AulasModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    /**
     * Metadados da "biblioteca" (curso) + progresso médio do usuário nas aulas desse curso.
     * IMPORTANTE: não retorna url_video (Aulas é independente do vídeo da biblioteca).
     */
    public function getBiblioteca(int $bid, int $uid): array {
        error_log("[AulasModel::getBiblioteca] IN bid={$bid} uid={$uid}");

        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                COALESCE(AVG(pa.percentual), 0) AS progresso
            FROM biblioteca b
            LEFT JOIN modulos m         ON m.biblioteca_id = b.id
            LEFT JOIN aulas   a         ON a.modulo_id     = m.id
            LEFT JOIN progresso_aula pa ON pa.aula_id      = a.id AND pa.usuario_id = :uid
            WHERE b.id = :bid
            GROUP BY b.id, b.titulo, b.descricao, b.imagem_capa
            LIMIT 1
        ";
        try {
            $st = $this->conn->prepare($sql);
            $st->execute([':bid'=>$bid, ':uid'=>$uid]);
            error_log("[AulasModel::getBiblioteca] SQL ok");
        } catch (Throwable $e) {
            error_log("[AulasModel::getBiblioteca] FALLBACK lite — ".$e->getMessage());
            $sql = "
                SELECT b.id, b.titulo, b.descricao, b.imagem_capa, 0 AS progresso
                FROM biblioteca b
                WHERE b.id = :bid
                LIMIT 1
            ";
            $st = $this->conn->prepare($sql);
            $st->execute([':bid'=>$bid]);
        }

        $row = $st->fetch(PDO::FETCH_ASSOC) ?: [];
        error_log("[AulasModel::getBiblioteca] OUT row=".json_encode($row, JSON_UNESCAPED_UNICODE));
        if (!$row) return [];
        $row['id']        = (int)($row['id'] ?? 0);
        $row['progresso'] = (float)($row['progresso'] ?? 0);
        return $row;
    }

    /**
     * Retorna a última aula acessada pelo usuário nesse curso (por atualizado_em).
     */
    public function getUltimaAulaAssistida(int $bid, int $uid): ?array {
        error_log("[AulasModel::getUltimaAulaAssistida] IN bid={$bid} uid={$uid}");
        $sql = "
            SELECT pa.aula_id, pa.percentual, pa.atualizado_em
            FROM progresso_aula pa
            JOIN aulas a   ON a.id = pa.aula_id
            JOIN modulos m ON m.id = a.modulo_id
            WHERE m.biblioteca_id = :bid
              AND pa.usuario_id   = :uid
            ORDER BY pa.atualizado_em DESC
            LIMIT 1
        ";
        $st = $this->conn->prepare($sql);
        $st->execute([':bid'=>$bid, ':uid'=>$uid]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        error_log("[AulasModel::getUltimaAulaAssistida] OUT row=".json_encode($row, JSON_UNESCAPED_UNICODE));
        return $row ?: null;
    }

    /**
     * Módulos + aulas + progresso/bloqueio por aula, ordenados.
     */
    public function getModulosEAulas(int $bid, int $uid): array {
        error_log("[AulasModel::getModulosEAulas] IN bid={$bid} uid={$uid}");

        // 1) Completo (com progresso)
        $sqlFull = "
            SELECT
                m.id     AS modulo_id,
                m.nome   AS modulo_nome,
                m.ordem  AS modulo_ordem,

                a.id         AS aula_id,
                a.titulo     AS aula_titulo,
                a.descricao  AS aula_descricao,
                a.url_video  AS aula_url,
                a.embed_url  AS aula_embed,
                a.ordem      AS aula_ordem,
                a.bloqueado  AS aula_bloqueado,

                COALESCE(pa.percentual,0) AS aula_percentual,
                COALESCE(pa.concluido,0)  AS aula_concluido
            FROM modulos m
            JOIN aulas a ON a.modulo_id = m.id
            LEFT JOIN progresso_aula pa ON pa.aula_id = a.id AND pa.usuario_id = :uid
            WHERE m.biblioteca_id = :bid
            ORDER BY m.ordem ASC, a.ordem ASC, a.id ASC
        ";
        try {
            $st = $this->conn->prepare($sqlFull);
            $st->execute([':bid'=>$bid, ':uid'=>$uid]);
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            error_log("[AulasModel::getModulosEAulas] BRANCH=FULL rows=".count($rows));
        } catch (Throwable $e1) {
            error_log("[AulasModel::getModulosEAulas] FULL FAIL — ".$e1->getMessage());

            // 2) Lite (sem progresso)
            $sqlLite = "
                SELECT
                    m.id     AS modulo_id,
                    m.nome   AS modulo_nome,
                    m.ordem  AS modulo_ordem,

                    a.id         AS aula_id,
                    a.titulo     AS aula_titulo,
                    a.descricao  AS aula_descricao,
                    a.url_video  AS aula_url,
                    a.embed_url  AS aula_embed,
                    a.ordem      AS aula_ordem,
                    a.bloqueado  AS aula_bloqueado
                FROM modulos m
                JOIN aulas a ON a.modulo_id = m.id
                WHERE m.biblioteca_id = :bid
                ORDER BY m.ordem ASC, a.id ASC
            ";
            try {
                $st2 = $this->conn->prepare($sqlLite);
                $st2->execute([':bid'=>$bid]);
                $rows = $st2->fetchAll(PDO::FETCH_ASSOC);
                error_log("[AulasModel::getModulosEAulas] BRANCH=LITE rows=".count($rows));
                foreach ($rows as &$r) {
                    if (!array_key_exists('aula_ordem', $r) || is_null($r['aula_ordem'])) $r['aula_ordem'] = 0;
                    if (!array_key_exists('aula_bloqueado', $r) || is_null($r['aula_bloqueado'])) $r['aula_bloqueado'] = 0;
                    $r['aula_percentual'] = 0;
                    $r['aula_concluido']  = 0;
                }
                unset($r);
            } catch (Throwable $e2) {
                error_log("[AulasModel::getModulosEAulas] LITE FAIL — ".$e2->getMessage());
                // 3) Ultra (mínimo)
                $sqlUltra = "
                    SELECT
                        m.id   AS modulo_id,
                        m.nome AS modulo_nome,

                        a.id         AS aula_id,
                        a.titulo     AS aula_titulo,
                        a.descricao  AS aula_descricao,
                        a.url_video  AS aula_url,
                        a.embed_url  AS aula_embed
                    FROM modulos m
                    JOIN aulas a ON a.modulo_id = m.id
                    WHERE m.biblioteca_id = :bid
                    ORDER BY m.id ASC, a.id ASC
                ";
                $st3 = $this->conn->prepare($sqlUltra);
                $st3->execute([':bid'=>$bid]);
                $rows = $st3->fetchAll(PDO::FETCH_ASSOC);
                error_log("[AulasModel::getModulosEAulas] BRANCH=ULTRA rows=".count($rows));
                foreach ($rows as &$r) {
                    $r['modulo_ordem']    = 0;
                    $r['aula_ordem']      = 0;
                    $r['aula_bloqueado']  = 0;
                    $r['aula_percentual'] = 0;
                    $r['aula_concluido']  = 0;
                }
                unset($r);
            }
        }

        // Linha única (trilha) para aplicar regras
        $trilha = [];
        foreach ($rows as $r) {
            $trilha[] = [
                'modulo_nome'  => $r['modulo_nome'] ?: 'Módulo',
                'modulo_ordem' => (int)($r['modulo_ordem'] ?? 0),

                'id'         => (int)$r['aula_id'],
                'titulo'     => $r['aula_titulo'],
                'descricao'  => $r['aula_descricao'],
                'url_video'  => $r['aula_url'],
                'embed_url'  => $r['aula_embed'],
                'ordem'      => (int)($r['aula_ordem'] ?? 0),
                'bloqueado'  => (int)($r['aula_bloqueado'] ?? 0) ? 1 : 0,

                'progresso'  => (float)($r['aula_percentual'] ?? 0),
                'concluido'  => (int)($r['aula_concluido'] ?? 0) ? 1 : 0,
            ];
        }
        error_log("[AulasModel::getModulosEAulas] trilha_count=".count($trilha));

        // Desbloqueio sequencial
        $prevConcluida = false;
        foreach ($trilha as $i => &$a) {
            $isConcl = ($a['concluido'] === 1) || ($a['progresso'] >= 100);
            if ($i === 0) $a['bloqueado'] = $a['bloqueado'] ? 1 : 0;
            else $a['bloqueado'] = ($a['bloqueado'] || !$prevConcluida) ? 1 : 0;
            $prevConcluida = $isConcl;
        }
        unset($a);

        // Agrupa por módulo
        $modulos = [];
        foreach ($trilha as $aula) {
            $nome = $aula['modulo_nome'];
            if (!isset($modulos[$nome])) $modulos[$nome] = [];
            $modulos[$nome][] = [
                'id'        => $aula['id'],
                'titulo'    => $aula['titulo'],
                'descricao' => $aula['descricao'],
                'url_video' => $aula['url_video'],
                'embed_url' => $aula['embed_url'],
                'ordem'     => $aula['ordem'],
                'bloqueado' => (bool)$aula['bloqueado'],
                'progresso' => $aula['progresso'],
                'modulo'    => $nome,
            ];
        }

        $countMod = count($modulos);
        $countAulas = 0; foreach ($modulos as $lista) { $countAulas += count($lista); }
        $firstMod = $countMod ? array_keys($modulos)[0] : null;
        $firstAula = $countAulas ? $modulos[$firstMod][0] : null;
        error_log("[AulasModel::getModulosEAulas] OUT modulos={$countMod} aulas={$countAulas} first_mod=".json_encode($firstMod)." first_aula_id=".json_encode($firstAula['id'] ?? null));

        return $modulos;
    }

    /**
     * Marca/atualiza progresso da aula do usuário.
     */
    public function upsertProgressoAula(int $aulaId, int $usuarioId, float $percentual, ?int $concluido = null): array {
        $logConcl = $concluido;
        if ($concluido === null) {
            $concluido = $percentual >= 100 ? 1 : 0;
        } else {
            $concluido = $concluido ? 1 : 0;
        }
        error_log("[AulasModel::upsertProgressoAula] IN aula={$aulaId} user={$usuarioId} pct={$percentual} concl_param=".json_encode($logConcl)." concl_final={$concluido}");

        $sql = "
            INSERT INTO progresso_aula (usuario_id, aula_id, percentual, concluido)
            VALUES (:uid, :aid, :pct, :concl)
            ON DUPLICATE KEY UPDATE
                percentual    = VALUES(percentual),
                concluido     = VALUES(concluido),
                atualizado_em = CURRENT_TIMESTAMP
        ";
        $st = $this->conn->prepare($sql);
        $st->execute([
            ':uid'   => $usuarioId,
            ':aid'   => $aulaId,
            ':pct'   => $percentual,
            ':concl' => $concluido
        ]);
        error_log("[AulasModel::upsertProgressoAula] OK rows=".$st->rowCount());

        return [
            'aula_id'    => $aulaId,
            'usuario_id' => $usuarioId,
            'percentual' => $percentual,
            'concluido'  => $concluido
        ];
    }
}
