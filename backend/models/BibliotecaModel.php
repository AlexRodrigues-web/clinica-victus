<?php
// backend/models/BibliotecaModel.php

require_once __DIR__ . '/../config/Conexao.php';

class BibliotecaModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
    }

    /**
     * Lista todos os cursos ativos (sem progresso).
     *
     * @return array Cada item: id, titulo, descricao, imagem_capa, url_video, tipo, data_publicacao
     */
    public function listarAtivos(): array {
        error_log("BibliotecaModel::listarAtivos iniciado");

        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                b.url_video,
                b.tipo,
                b.data_publicacao
            FROM biblioteca b
            WHERE b.ativo = 1
            ORDER BY b.data_publicacao DESC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("BibliotecaModel::total listarAtivos: " . count($resultados));

        return $resultados;
    }

    /**
     * Lista todos os cursos ativos, incluindo o progresso médio do usuário
     * sobre os vídeos de cada curso.
     *
     * @param int $usuarioId
     * @return array Cada item: id, titulo, descricao, imagem_capa, url_video, tipo, progresso
     */
    public function listarComProgresso(int $usuarioId): array {
        error_log("BibliotecaModel::listarComProgresso iniciado para usuario_id={$usuarioId}");

        $sql = "
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                b.url_video,
                b.tipo,
                COALESCE(AVG(p.percentual), 0) AS progresso
            FROM biblioteca b
            /* junta apenas vídeos ativos vinculados ao curso */
            LEFT JOIN video v 
              ON v.biblioteca_id = b.id
             AND v.ativo         = 1
            /* junta progresso do usuário sobre cada vídeo */
            LEFT JOIN progresso_video p
              ON p.video_id    = v.id
             AND p.usuario_id  = :usuario_id
            WHERE b.ativo = 1
            GROUP BY 
                b.id, b.titulo, b.descricao, b.imagem_capa, 
                b.url_video, b.tipo, b.data_publicacao
            ORDER BY b.data_publicacao DESC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':usuario_id', $usuarioId, PDO::PARAM_INT);
        $stmt->execute();

        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("BibliotecaModel::total listarComProgresso: " . count($resultados));

        return $resultados;
    }

    /**
     * Insere um novo curso na biblioteca.
     *
     * @param array $data  ['titulo','descricao','url_video','imagem_capa','tipo']
     * @return array       Registro recém-criado
     * @throws Exception
     */
    public function adicionar(array $data): array {
        error_log("BibliotecaModel::adicionar iniciado");

        $sql = "
            INSERT INTO biblioteca
                (titulo, descricao, url_video, imagem_capa, tipo, ativo, data_publicacao)
            VALUES
                (:titulo, :descricao, :url_video, :imagem_capa, :tipo, 1, NOW())
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':titulo'     => $data['titulo'],
            ':descricao'  => $data['descricao'],
            ':url_video'  => $data['url_video'],
            ':imagem_capa'=> $data['imagem_capa'],
            ':tipo'       => $data['tipo'],
        ]);

        $novoId = (int)$this->conn->lastInsertId();
        error_log("BibliotecaModel::adicionar ID criado: $novoId");

        // Busca o registro recém-criado para devolver ao frontend
        $stmt2 = $this->conn->prepare("
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                b.url_video,
                b.tipo,
                b.data_publicacao
            FROM biblioteca b
            WHERE b.id = :id
            LIMIT 1
        ");
        $stmt2->execute([':id' => $novoId]);
        $registro = $stmt2->fetch(PDO::FETCH_ASSOC);

        return $registro ?: [];
    }
}
