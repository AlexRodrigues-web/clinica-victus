<?php
require_once __DIR__ . '/config/db.php';

$db = new Database();
$conn = $db->conectar();

$nome = "Alex";
$email = "alex@victus.com";
$senha = password_hash("123456", PASSWORD_DEFAULT);
$nivel = "admin";

$query = "INSERT INTO usuarios (nome, email, senha, nivel) VALUES (:nome, :email, :senha, :nivel)";
$stmt = $conn->prepare($query);
$stmt->bindParam(':nome', $nome);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':senha', $senha);
$stmt->bindParam(':nivel', $nivel);

if ($stmt->execute()) {
    echo "Usuário inserido com sucesso.";
    error_log("Usuário de teste inserido: $email");
} else {
    echo "Erro ao inserir.";
    error_log("Erro ao inserir usuário de teste: $email");
}
