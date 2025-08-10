<?php
// backend/models/BibliotecaModel.php

require_once __DIR__ . '/../config/Conexao.php';

class BibliotecaModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
    }

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
            LEFT JOIN video v 
              ON v.biblioteca_id = b.id
             AND v.ativo         = 1
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

    /**
     * Novo método: Detalhes com módulos, aulas, materiais e progresso do usuário
     */
    public function getDetalhesComModulos(int $bibliotecaId, int $usuarioId): array {
        error_log("BibliotecaModel::getDetalhesComModulos iniciado. biblioteca={$bibliotecaId}, usuario={$usuarioId}");

        // Detalhes do curso
        $stmtCurso = $this->conn->prepare("
            SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.imagem_capa,
                b.url_video,
                b.tipo,
                COALESCE(AVG(p.percentual), 0) AS progresso
            FROM biblioteca b
            LEFT JOIN video v ON v.biblioteca_id = b.id
            LEFT JOIN progresso_video p 
                ON p.video_id = v.id AND p.usuario_id = :usuario
            WHERE b.id = :biblioteca
            GROUP BY b.id
            LIMIT 1
        ");
        $stmtCurso->execute([
            ':usuario'    => $usuarioId,
            ':biblioteca' => $bibliotecaId
        ]);
        $curso = $stmtCurso->fetch(PDO::FETCH_ASSOC);

        if (!$curso) {
            throw new Exception("Curso não encontrado");
        }

        // Módulos e aulas
        $stmtModulos = $this->conn->prepare("
            SELECT 
                m.id AS modulo_id,
                m.nome AS modulo_nome,
                v.id AS video_id,
                v.titulo AS video_titulo,
                v.descricao AS video_descricao,
                v.url_video,
                COALESCE(p.percentual, 0) AS progresso,
                CASE WHEN v.ordem > (
                    SELECT MAX(v2.ordem) 
                    FROM progresso_video p2
                    JOIN video v2 ON p2.video_id = v2.id
                    WHERE p2.usuario_id = :usuario2 AND v2.biblioteca_id = :biblioteca2
                ) + 1 THEN 1 ELSE 0 END AS bloqueado
            FROM modulo m
            LEFT JOIN video v ON v.modulo_id = m.id
            LEFT JOIN progresso_video p 
                ON p.video_id = v.id AND p.usuario_id = :usuario3
            WHERE m.biblioteca_id = :biblioteca3
            ORDER BY m.ordem ASC, v.ordem ASC
        ");
        $stmtModulos->execute([
            ':usuario2'    => $usuarioId,
            ':biblioteca2' => $bibliotecaId,
            ':usuario3'    => $usuarioId,
            ':biblioteca3' => $bibliotecaId
        ]);
        $modulosRaw = $stmtModulos->fetchAll(PDO::FETCH_ASSOC);

        $modulos = [];
        foreach ($modulosRaw as $row) {
            $moduloNome = $row['modulo_nome'] ?: 'Módulo';
            if (!isset($modulos[$moduloNome])) {
                $modulos[$moduloNome] = [];
            }
            $modulos[$moduloNome][] = [
                'id'        => $row['video_id'],
                'titulo'    => $row['video_titulo'],
                'descricao' => $row['video_descricao'],
                'url_video' => $row['url_video'],
                'progresso' => (float)$row['progresso'],
                'modulo'    => $moduloNome,
                'bloqueado' => (bool)$row['bloqueado'],
                'ordem'     => 0 // caso queira usar ordem futuramente
            ];
        }

        // Materiais relacionados
        $stmtMateriais = $this->conn->prepare("
            SELECT 
                id, titulo, url_arquivo, tipo
            FROM materiais
            WHERE biblioteca_id = :biblioteca
            ORDER BY titulo ASC
        ");
        $stmtMateriais->execute([':biblioteca' => $bibliotecaId]);
        $materiais = $stmtMateriais->fetchAll(PDO::FETCH_ASSOC);

        return [
            'biblioteca' => $curso,
            'modulos'    => $modulos,
            'materiais'  => $materiais
        ];
    }
}
