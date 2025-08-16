<?php
class LembreteModel {
  private $pdo;
  public function __construct() { $this->pdo = require __DIR__ . '/../pdo.php'; }

  public function lembreteDoDia(int $usuarioId): ?string {
    $hoje = date('Y-m-d');
    // 1) específico do usuário para hoje
    $sql1 = "SELECT mensagem FROM lembretes
             WHERE (usuario_id = :u) AND DATE(data) = :d
             ORDER BY id DESC LIMIT 1";
    $st = $this->pdo->prepare($sql1);
    $st->execute([':u' => $usuarioId, ':d' => $hoje]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    if ($r && !empty($r['mensagem'])) return $r['mensagem'];

    // 2) global do dia (usuario_id NULL)
    $sql2 = "SELECT mensagem FROM lembretes
             WHERE usuario_id IS NULL AND DATE(data) = :d
             ORDER BY id DESC LIMIT 1";
    $st = $this->pdo->prepare($sql2);
    $st->execute([':d' => $hoje]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    return $r['mensagem'] ?? null;
  }
}
