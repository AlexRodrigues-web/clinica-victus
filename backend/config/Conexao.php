<?php
// backend/config/Conexao.php

class Conexao {
    private static $conn;

    public static function getConexao() {
        if (!self::$conn) {
            error_log("Conexao::iniciando conexão com o banco");
            try {
                self::$conn = new PDO(
                    "mysql:host=localhost;dbname=clinica_victus;charset=utf8mb4",
                    "root",
                    "" // sua senha, se houver
                );
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                error_log("Erro de conexão: " . $e->getMessage());
                http_response_code(500);
                die(json_encode(['erro' => 'Erro ao conectar com o banco de dados']));
            }
        }
        return self::$conn;
    }
}

// função simples de conveniência para o perfil.php
if (!function_exists('conectar')) {
    function conectar() {
        return Conexao::getConexao();
    }
}
