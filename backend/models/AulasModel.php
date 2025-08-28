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
     * Usa sempre o registro MAIS RECENTE de progresso_aula por aula/usuário.
     */
    public function getBiblioteca(int $bid, int $uid): array {
        error_log("[AulasModel::getBiblioteca] IN bid={$bid} uid={$uid}");

        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                COALESCE(AVG(COALESCE(pa_latest.percentual, 0)), 0) AS progresso
            FROM biblioteca b
            LEFT JOIN modulos m ON m.biblioteca_id = b.id
            LEFT JOIN aulas   a ON a.modulo_id     = m.id
            /* progresso mais recente por aula/usuário */
            LEFT JOIN (
                SELECT x.aula_id, x.percentual
                  FROM progresso_aula x
                  JOIN (
                        SELECT aula_id,
                               MAX(atualizado_em) AS max_at,
                               MAX(id)            AS max_id
                          FROM progresso_aula
                         WHERE usuario_id = :uid
                         GROUP BY aula_id
                  ) last ON last.aula_id = x.aula_id
                       AND (x.atualizado_em = last.max_at OR x.id = last.max_id)
                 WHERE x.usuario_id = :uid
            ) pa_latest ON pa_latest.aula_id = a.id
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
            ORDER BY pa.atualizado_em DESC, pa.id DESC
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
     * Junta SEMPRE a linha mais recente de progresso_aula para o usuário.
     * Dedup é aplicado ANTES do desbloqueio sequencial.
     */
    public function getModulosEAulas(int $bid, int $uid): array {
        error_log("[AulasModel::getModulosEAulas] IN bid={$bid} uid={$uid}");

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
            LEFT JOIN progresso_aula pa
                   ON pa.id = (
                        SELECT pa2.id
                          FROM progresso_aula pa2
                         WHERE pa2.aula_id = a.id
                           AND pa2.usuario_id = :uid
                         ORDER BY pa2.atualizado_em DESC, pa2.id DESC
                         LIMIT 1
                   )
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

        // 1) Trilha única (como veio do DB)
        $trilha = [];
        foreach ($rows as $r) {
            $trilha[] = [
                'modulo_id'    => (int)$r['modulo_id'],
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

        // 2) DEDUP (por módulo + ordem) OU (módulo + título normalizado)
        $dedup = [];
        $posByKey = [];
        foreach ($trilha as $a) {
            $mod = $a['modulo_nome'] ?: 'Módulo';
            $ord = isset($a['ordem']) ? (int)$a['ordem'] : null;
            $tituloNorm = mb_strtolower(trim((string)($a['titulo'] ?? '')), 'UTF-8');
            $key = $mod . '|' . ($ord !== null ? "ordem:$ord" : "titulo:$tituloNorm");

            if (!isset($posByKey[$key])) {
                $posByKey[$key] = count($dedup);
                $dedup[] = $a;
            } else {
                $pos = $posByKey[$key];
                // mantém a com menor id
                if ((int)$a['id'] < (int)$dedup[$pos]['id']) {
                    $dedup[$pos] = $a;
                }
            }
        }
        if (count($dedup) !== count($trilha)) {
            error_log("[AulasModel::getModulosEAulas] DEDUP aplicado: ".count($trilha)." -> ".count($dedup));
        }

        // 3) Normaliza concluído se progresso >= 100
        foreach ($dedup as &$a0) {
            if ((float)($a0['progresso'] ?? 0) >= 100) $a0['concluido'] = 1;
        }
        unset($a0);

        // 4) Desbloqueio sequencial: só entre aulas com player (ignora bloqueio manual)
        $prevPlayableConcluida = true; // libera a primeira tocável SEMPRE
        $jaVimosTocavel = false;

        foreach ($dedup as $i => &$a) {
            $hasPlayer = (trim((string)$a['embed_url']) !== '' || trim((string)$a['url_video']) !== '');
            $isConcl   = (($a['concluido'] ?? 0) == 1) || ((float)($a['progresso'] ?? 0) >= 100);

            if ($hasPlayer) {
                if (!$jaVimosTocavel) {
                    $a['bloqueado'] = 0;       // primeira tocável sempre livre
                    $jaVimosTocavel = true;
                } else {
                    // depende apenas da aula tocável anterior ter sido concluída
                    $a['bloqueado'] = $prevPlayableConcluida ? 0 : 1;
                }
                $prevPlayableConcluida = $isConcl;
            } else {
                // sem player não trava sequência
                $a['bloqueado'] = 0;
            }
        }
        unset($a);

        // 5) Agrupa por módulo
        $modulos = [];
        foreach ($dedup as $aula) {
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
