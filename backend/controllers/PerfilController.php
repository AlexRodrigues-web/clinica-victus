<?php
// backend/controllers/PerfilController.php

require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../helpers/AuthHelper.php';

class PerfilController {
    private $model;

    public function __construct() {
        $this->model = new UsuarioModel();
    }

  
    public function handleRequest() {
        $usuarioId = AuthHelper::validarToken();
        if (!$usuarioId) {
            http_response_code(401);
            echo json_encode(['erro' => 'Não autorizado']);
            return;
        }

        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                $this->obterPerfil($usuarioId);
                break;

            case 'PUT':
                $this->atualizarPerfil($usuarioId);
                break;

            case 'POST':
                // upload de foto espera arquivo em $_FILES['foto_perfil']
                $this->uploadFoto($usuarioId);
                break;

            default:
                http_response_code(405);
                echo json_encode(['erro' => 'Método não permitido']);
        }
    }

    private function obterPerfil(int $usuarioId) {
        $usuario = $this->model->buscarPorId($usuarioId);
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['erro' => 'Usuário não encontrado']);
            return;
        }
        echo json_encode($usuario);
    }


    private function atualizarPerfil(int $usuarioId) {
        // extrai dados JSON do corpo
        $dados = json_decode(file_get_contents('php://input'), true);
        if (!is_array($dados) || empty($dados)) {
            http_response_code(400);
            echo json_encode(['erro' => 'Dados inválidos ou vazios']);
            return;
        }

        $ok = $this->model->atualizar($usuarioId, $dados);
        if ($ok) {
            echo json_encode(['sucesso' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['erro' => 'Falha ao atualizar perfil']);
        }
    }

   
    private function uploadFoto(int $usuarioId) {
        if (
            !isset($_FILES['foto_perfil']) ||
            $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK
        ) {
            http_response_code(400);
            echo json_encode(['erro' => 'Arquivo não enviado ou inválido']);
            return;
        }

        $caminho = $this->model->salvarFoto($usuarioId, $_FILES['foto_perfil']);
        if ($caminho) {
            echo json_encode(['foto_perfil' => $caminho]);
        } else {
            http_response_code(500);
            echo json_encode(['erro' => 'Falha no upload da foto']);
        }
    }
}
