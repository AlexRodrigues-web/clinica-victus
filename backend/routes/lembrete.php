<?php
// backend/routes/lembrete.php

require_once __DIR__ . '/../config/db.php';

$db = new Database();
$pdo = $db->conectar();

$dataHoje = date('Y-m-d');

// Consulta para buscar o lembrete do dia
$stmt = $pdo->prepare("SELECT mensagem FROM lembretes WHERE data = :data");
$stmt->bindParam(':data', $dataHoje);
$stmt->execute();

$lembrete = $stmt->fetch(PDO::FETCH_ASSOC);

if ($lembrete) {
    echo json_encode(['mensagem' => $lembrete['mensagem']]);
} else {
    echo json_encode(['mensagem' => 'Nenhum lembrete encontrado para hoje.']);
}
