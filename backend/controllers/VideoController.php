<?php
// backend/controllers/VideoController.php

require_once __DIR__ . '/../models/VideoModel.php';

class VideoController {
    private $model;

    public function __construct() {
        $this->model = new VideoModel();
    }

    public function detalhes($bibliotecaId, $usuarioId) {
        $bibliotecaId = (int)$bibliotecaId;
        $usuarioId    = (int)$usuarioId;

        error_log("VideoController::detalhes iniciado — bibliotecaId={$bibliotecaId}, usuarioId={$usuarioId}");

        try {
            // 1) Metadados da biblioteca + progresso geral
            $meta = $this->model->getBiblioteca($bibliotecaId, $usuarioId);
            if (empty($meta)) {
                http_response_code(404);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'sucesso' => false,
                    'erro'    => 'Conteúdo não encontrado'
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                return;
            }

            // 2) Lista de aulas (vídeos) agrupadas por módulo
            $aulas = $this->model->getAulas($bibliotecaId, $usuarioId);

            // 3) Agrupar as aulas dentro de cada módulo e ordenar por ordem
            $modulos = [];
            foreach ($aulas as $aula) {
                $nomeModulo = $aula['modulo'] ?? 'Módulo';
                if (!isset($modulos[$nomeModulo])) {
                    $modulos[$nomeModulo] = [];
                }

                $modulos[$nomeModulo][] = [
                    'id'         => (int)   ($aula['id'] ?? 0),
                    'titulo'     => (string)($aula['titulo'] ?? ''),
                    'descricao'  => (string)($aula['descricao'] ?? ''),
                    'url_video'  => (string)($aula['url_video'] ?? ''),
                    'embed_url'  => (string)($aula['embed_url'] ?? ''),
                    'ordem'      => (int)   ($aula['ordem'] ?? 0),
                    'bloqueado'  => (bool)  ($aula['bloqueado'] ?? 0),
                    'progresso'  => (float) ($aula['progresso'] ?? 0),
                    'materiais'  =>          $aula['materiais'] ?? [],
                ];
            }

            // Ordena cada módulo por 'ordem'
            foreach ($modulos as &$aulasDoModulo) {
                usort($aulasDoModulo, function($a, $b) {
                    return $a['ordem'] <=> $b['ordem'];
                });
            }
            unset($aulasDoModulo);

            // 4) Formata dados da biblioteca
            $biblioteca = [
                'id'          => (int)   ($meta['id'] ?? 0),
                'titulo'      => (string)($meta['titulo'] ?? ''),
                'descricao'   => (string)($meta['descricao'] ?? ''),
                'url_video'   => (string)($meta['url_video'] ?? ''),
                'imagem_capa' => (string)($meta['imagem_capa'] ?? ''),
                'progresso'   => (float) ($meta['progresso'] ?? 0),
            ];

            // 5) Retorna JSON
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso'    => true,
                'biblioteca' => $biblioteca,
                'modulos'    => $modulos
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        } catch (Exception $e) {
            error_log("VideoController::erro interno — " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso' => false,
                'erro'    => 'Erro interno ao buscar os detalhes'
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
}
