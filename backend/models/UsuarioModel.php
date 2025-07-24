<?php
// backend/models/UsuarioModel.php

require_once __DIR__ . '/../config/db.php';

class UsuarioModel {
    private $conn;
    private $tabela = "usuarios";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->conectar();
    }

    public function buscarPorEmail($email) {
        try {
            $query = "SELECT * FROM {$this->tabela} WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email);
            $stmt->execute();

            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("UsuarioModel::buscarPorEmail executado para email: $email");

            return $usuario ?: null;
        } catch (PDOException $e) {
            error_log("Erro em UsuarioModel::buscarPorEmail - " . $e->getMessage());
            return null;
        }
    }

    public function buscarPorId($id) {
        try {
            // Busca dados do usuário com INNER JOIN nos dados do plano e config
            $query = "
                SELECT 
                    u.id, u.nome, u.email, u.dt_registro,
                    u.foto_perfil, u.genero, u.data_nascimento,
                    u.telefone, u.endereco,
                    p.nome AS plano_nome, p.objetivo, p.duracao, p.progresso,
                    c.notificacoes, c.idioma
                FROM {$this->tabela} u
                LEFT JOIN planos p ON u.plano_id = p.id
                LEFT JOIN configuracoes_usuarios c ON u.id = c.usuario_id
                WHERE u.id = :id
                LIMIT 1
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("UsuarioModel::buscarPorId executado para ID: $id");

            if (!$row) return null;

            // Estrutura de retorno
            return [
                'id' => $row['id'],
                'nome' => $row['nome'],
                'email' => $row['email'],
                'dt_registro' => $row['dt_registro'],
                'foto_perfil' => $row['foto_perfil'],
                'genero' => $row['genero'],
                'data_nascimento' => $row['data_nascimento'],
                'telefone' => $row['telefone'],
                'endereco' => $row['endereco'],
                'plano' => [
                    'nome' => $row['plano_nome'],
                    'objetivo' => $row['objetivo'],
                    'duracao' => $row['duracao'],
                    'progresso' => $row['progresso']
                ],
                'config' => [
                    'notificacoes' => (bool) $row['notificacoes'],
                    'idioma' => $row['idioma']
                ]
            ];
        } catch (PDOException $e) {
            error_log("Erro em UsuarioModel::buscarPorId - " . $e->getMessage());
            return null;
        }
    }
}
