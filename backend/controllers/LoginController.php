<?php
// backend/controllers/LoginController.php

require_once __DIR__ . '/../models/UsuarioModel.php';
require_once __DIR__ . '/../helpers/jwt.php';

class LoginController {
    private $usuarioModel;

    public function __construct() {
        $this->usuarioModel = new UsuarioModel();
    }

    public function autenticar($dados) {
        error_log("LoginController::autenticar iniciado");

        if (!isset($dados['email']) || !isset($dados['senha'])) {
            error_log("LoginController::dados incompletos");
            return ['erro' => 'Email e senha são obrigatórios'];
        }

        $email = trim($dados['email']);
        $senha = trim($dados['senha']);

        $usuario = $this->usuarioModel->buscarPorEmail($email);

        if (!$usuario) {
            error_log("LoginController::usuário não encontrado para email: $email");
            return ['erro' => 'Usuário não encontrado'];
        }

        if (!password_verify($senha, $usuario['senha'])) {
            error_log("LoginController::senha inválida para email: $email");
            return ['erro' => 'Senha incorreta'];
        }

        // Remover a senha do retorno
        unset($usuario['senha']);

        // Gerar JWT
        $token = gerarJWT($usuario);
        error_log("LoginController::JWT gerado com sucesso para usuário ID: {$usuario['id']}");

        return [
            'mensagem' => 'Login bem-sucedido',
            'usuario' => $usuario,
            'token' => $token
        ];
    }
}
