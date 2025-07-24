<?php
// backend/config/Conexao.php

class Conexao {
    private static $conn;

    public static function getConexao() {
        if (!self::$conn) {
            error_log("Conexao::iniciando conexão com o banco");
            try {
                self::$conn = new PDO("mysql:host=localhost;dbname=clinica_victus;charset=utf8", "root", "");
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                error_log("Erro de conexão: " . $e->getMessage());
                die(json_encode(['erro' => 'Erro ao conectar com o banco de dados']));
            }
        }

        return self::$conn;
    }
}
