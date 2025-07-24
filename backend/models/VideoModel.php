<?php
// backend/models/VideoModel.php

require_once __DIR__ . '/../config/Conexao.php';

class VideoModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
    }

    /**
     * Retorna metadados da biblioteca (curso) e progresso geral do usuário
     *
     * @param int $bid  ID da biblioteca (curso)
     * @param int $uid  ID do usuário
     * @return array    ['id'=>…, 'titulo'=>…, 'descricao'=>…, 'progresso'=>…]
     */
    public function getBiblioteca(int $bid, int $uid): array {
        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                COALESCE(
                  (SELECT AVG(p.percentual)
                   FROM video v
                   LEFT JOIN progresso_video p
                     ON p.video_id = v.id
                    AND p.usuario_id = :uid
                   WHERE v.biblioteca_id = b.id
                     AND v.ativo = 1
                  ), 0
                ) AS progresso
            FROM biblioteca b
            WHERE b.id = :bid
              AND b.ativo = 1
            LIMIT 1
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':bid' => $bid,
            ':uid' => $uid
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: [];
    }

    /**
     * Retorna todas as aulas (vídeos) de um curso, com bloqueio, progresso individual
     * e já retorna a URL de embed pronta para uso em <iframe>.
     *
     * @param int $bid  ID da biblioteca (curso)
     * @param int $uid  ID do usuário
     * @return array    Cada item: [
     *                      'id','titulo','descricao',
     *                      'url_video','embed_url','ordem',
     *                      'modulo','bloqueado','progresso'
     *                  ]
     */
    public function getAulas(int $bid, int $uid): array {
        $sql = "
            SELECT
                v.id,
                v.titulo,
                v.descricao,
                v.url_video,
                -- Gera a URL de embed do YouTube, se for link padrão
                CASE
                  WHEN v.url_video LIKE '%watch?v=%' THEN
                    CONCAT(
                      'https://www.youtube.com/embed/',
                      SUBSTRING_INDEX(SUBSTRING_INDEX(v.url_video, 'watch?v=', -1), '&', 1)
                    )
                  WHEN v.url_video LIKE '%youtu.be/%' THEN
                    CONCAT(
                      'https://www.youtube.com/embed/',
                      SUBSTRING_INDEX(SUBSTRING_INDEX(v.url_video, 'youtu.be/', -1), '?', 1)
                    )
                  ELSE
                    v.url_video
                END AS embed_url,
                v.ordem,
                v.modulo,
                v.bloqueado,
                COALESCE(p.percentual, 0) AS progresso
            FROM video v
            LEFT JOIN progresso_video p
              ON p.video_id = v.id
             AND p.usuario_id = :uid
            WHERE v.biblioteca_id = :bid
              AND v.ativo = 1
            ORDER BY v.modulo, v.ordem
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':bid' => $bid,
            ':uid' => $uid
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
