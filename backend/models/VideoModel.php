<?php
require_once __DIR__ . '/../config/Conexao.php';

class VideoModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
    }

    /**
     * Retorna metadados da biblioteca + progresso médio do usuário
     * (baseado em progresso_video e nos vídeos ativos da biblioteca).
     */
    public function getBiblioteca(int $bid, int $uid): array {
        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                b.url_video,
                COALESCE(AVG(p.percentual), 0) AS progresso
            FROM biblioteca b
            LEFT JOIN video v
                   ON v.biblioteca_id = b.id
                  AND v.ativo = 1
            LEFT JOIN progresso_video p
                   ON p.video_id  = v.id
                  AND p.usuario_id = :uid
            WHERE b.id = :bid
            GROUP BY b.id, b.titulo, b.descricao, b.imagem_capa, b.url_video
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':bid' => $bid, ':uid' => $uid]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        if (!$row) {
            return [];
        }

        // Garantia de tipos básicos
        $row['id']        = (int)($row['id'] ?? 0);
        $row['progresso'] = (float)($row['progresso'] ?? 0);

        error_log("VideoModel::getBiblioteca OK — bid={$bid}, uid={$uid}");
        return $row;
    }

    /**
     * Retorna a grade de vídeos da biblioteca (as “aulas”), agrupáveis por módulo.
     * OBS: devolve as chaves exatamente como o controller espera:
     *  id, titulo, descricao, url_video, embed_url, ordem, bloqueado, progresso, modulo
     */
    public function getAulas(int $bid, int $uid): array {
        $sql = "
            SELECT
                v.id,
                v.titulo,
                v.descricao,
                v.url_video,
                v.ordem,
                v.bloqueado,
                COALESCE(p.percentual, 0) AS progresso,
                COALESCE(v.modulo, m.nome)  AS modulo,
                COALESCE(m.ordem, 9999)     AS modulo_ordem
            FROM video v
            LEFT JOIN modulos m
                   ON m.biblioteca_id = v.biblioteca_id
                  AND m.nome = v.modulo
            LEFT JOIN progresso_video p
                   ON p.video_id   = v.id
                  AND p.usuario_id = :uid
            WHERE v.biblioteca_id = :bid
              AND v.ativo = 1
            ORDER BY modulo_ordem ASC, v.ordem ASC, v.id ASC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':bid' => $bid, ':uid' => $uid]);
        $aulas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Monta embed_url (YouTube) de forma robusta e anexar materiais (se houver)
        $ids = [];
        foreach ($aulas as &$a) {
            $a['id']        = (int)($a['id'] ?? 0);
            $a['ordem']     = (int)($a['ordem'] ?? 0);
            $a['bloqueado'] = (int)($a['bloqueado'] ?? 0) ? 1 : 0; // manter como tinyint para compat com controller atual
            $a['progresso'] = (float)($a['progresso'] ?? 0);
            $a['modulo']    = $a['modulo'] ?: 'Módulo';

            // embed_url calculado a partir da url do vídeo
            $a['embed_url'] = $this->buildEmbedUrlFromRaw($a['url_video'] ?? '');

            $ids[] = $a['id'];
        }
        unset($a);

        // (Opcional/Seguro) Materiais por vídeo, se a estrutura existir
        $materiaisPorVideo = [];
        if (!empty($ids)) {
            try {
                $place = implode(',', array_fill(0, count($ids), '?'));
                // Ajuste aqui conforme a sua estrutura real de 'materiais'
                // Tentativa 1: materiais ligados ao vídeo
                $sqlMat = "SELECT id, video_id, titulo, arquivo_url, data_upload
                           FROM materiais
                           WHERE video_id IN ($place)";
                $stmtMat = $this->conn->prepare($sqlMat);
                $stmtMat->execute($ids);
                foreach ($stmtMat->fetchAll(PDO::FETCH_ASSOC) as $mat) {
                    $vid = (int)$mat['video_id'];
                    $materiaisPorVideo[$vid][] = $mat;
                }
            } catch (\Throwable $e) {
                // Se a coluna/tabela não existir nesse formato, apenas ignora.
                error_log("VideoModel::getAulas — materiais por video indisponíveis: " . $e->getMessage());
            }
        }

        // Anexa materiais (se encontrados)
        foreach ($aulas as &$a) {
            $a['materiais'] = $materiaisPorVideo[$a['id']] ?? [];
        }
        unset($a);

        error_log("VideoModel::getAulas retornou " . count($aulas) . " registros via tabela `video` (bid={$bid})");
        return $aulas;
    }

    // ---------- Helpers privados ----------

    /**
     * Constrói embed do YouTube (nocookie) a partir de vários formatos de URL.
     */
    private function buildEmbedUrlFromRaw(?string $url): string {
        $id = $this->extractYouTubeId($url ?? '');
        return $id ? ("https://www.youtube-nocookie.com/embed/" . $id) : '';
    }

    /**
     * Extrai ID do YouTube de formatos watch, youtu.be, embed, shorts, live.
     */
    private function extractYouTubeId(string $rawUrl): ?string {
        $rawUrl = trim($rawUrl);
        if ($rawUrl === '') return null;

        // Tenta com parse de URL real
        try {
            $u = new \URL($rawUrl);
        } catch (\Throwable $e) {
            // Sem protocolo? faz parse manual por regex
            // ?v=XXXXXXXXXXX
            if (preg_match('/[?&]v=([\w-]{11})/i', $rawUrl, $m)) return $m[1];
            if (preg_match('#youtu\.be/([\w-]{11})#i', $rawUrl, $m)) return $m[1];
            if (preg_match('#embed/([\w-]{11})#i', $rawUrl, $m)) return $m[1];
            if (preg_match('#shorts/([\w-]{11})#i', $rawUrl, $m)) return $m[1];
            if (preg_match('#live/([\w-]{11})#i', $rawUrl, $m)) return $m[1];
            return null;
        }

        // Se conseguir instanciar URL (PHP não tem URL nativa, então acima sempre cai no catch).
        return null;
    }
}
