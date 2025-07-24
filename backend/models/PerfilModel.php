<?php
// backend/models/PerfilModel.php

require_once __DIR__ . '/../config/Conexao.php';

class PerfilModel {
    private $conn;

    public function __construct() {
        $this->conn = Conexao::getConexao();
    }

    public function buscar(int $uid): ?array {
        $sql = "SELECT * FROM usuarios WHERE id = :uid";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':uid' => $uid]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function atualizar(int $uid, array $dados): bool {
        $fields = [];
        $params = [':uid' => $uid];
        foreach ($dados as $k => $v) {
            $fields[] = "`$k` = :$k";
            $params[":$k"] = $v;
        }
        $sql = "UPDATE usuarios SET " . implode(',', $fields) . " WHERE id = :uid";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute($params);
    }

    public function salvarFoto(int $uid, array $file): ?string {
        if ($file['error'] !== UPLOAD_ERR_OK) return null;
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $novoNome = "user_{$uid}_" . time() . ".$ext";
        $dest = __DIR__ . "/../uploads/{$novoNome}";
        if (!move_uploaded_file($file['tmp_name'], $dest)) return null;
        // Atualiza no banco
        $sql = "UPDATE usuarios SET foto_perfil = :foto WHERE id = :uid";
        $stmt = $this->conn->prepare($sql);
        if ($stmt->execute([':foto' => "/uploads/{$novoNome}", ':uid' => $uid])) {
            return "/uploads/{$novoNome}";
        }
        return null;
    }
}
