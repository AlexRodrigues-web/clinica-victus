<?php
// backend/controllers/VideoController.php

require_once __DIR__ . '/../models/VideoModel.php';

class VideoController {
    private $model;

    public function __construct() {
        $this->model = new VideoModel();
    }

   
    public function detalhes($bibliotecaId, $usuarioId) {
        error_log("VideoController::detalhes iniciado — bibliotecaId={$bibliotecaId}, usuarioId={$usuarioId}");
        try {
            // 1) Metadados da biblioteca + progresso geral
            $meta = $this->model->getBiblioteca($bibliotecaId, $usuarioId);
            if (!$meta) {
                http_response_code(404);
                echo json_encode([
                    'sucesso' => false,
                    'erro'    => 'Conteúdo não encontrado'
                ]);
                return;
            }

            // 2) Lista de aulas com bloqueio e progresso individual
            $aulas = $this->model->getAulas($bibliotecaId, $usuarioId);

            // 3) Agrupa as aulas por módulo
            $modulos = [];
            foreach ($aulas as $aula) {
                $modulos[$aula['modulo']][] = [
                    'id'         => (int)   $aula['id'],
                    'titulo'     =>          $aula['titulo'],
                    'descricao'  =>          $aula['descricao'],
                    'url_video'  =>          $aula['url_video'],
                    'ordem'      => (int)   $aula['ordem'],
                    'bloqueado'  => (bool)  $aula['bloqueado'],
                    'progresso'  => (int)   $aula['progresso'],
                ];
            }

            // 4) Formata os dados da biblioteca
            $biblioteca = [
                'id'        => (int) $meta['id'],
                'titulo'    =>       $meta['titulo'],
                'descricao' =>       $meta['descricao'] ?? '',
                'progresso' => (int) $meta['progresso'],
            ];

            // 5) Retorna JSON
            echo json_encode([
                'sucesso'    => true,
                'biblioteca' => $biblioteca,
                'modulos'    => $modulos
            ]);
        } catch (Exception $e) {
            error_log("VideoController::erro interno — " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro'    => 'Erro interno ao buscar os detalhes'
            ]);
        }
    }
}
