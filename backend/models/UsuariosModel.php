<?php
class UsuariosModel {
  private $pdo;
  public function __construct() { $this->pdo = require __DIR__ . '/../pdo.php'; }

  // Tenta progresso_usuario; se não existir, tenta somar em progresso
  public function progressoPeso(int $usuarioId): array {
    // 1) progresso_usuario (peso_inicial, peso_atual) — ajuste nomes se preciso
    try {
      $q = $this->pdo->prepare("SELECT peso_inicial, peso_atual FROM progresso_usuario WHERE usuario_id=:u ORDER BY id DESC LIMIT 1");
      $q->execute([':u' => $usuarioId]);
      $r = $q->fetch(PDO::FETCH_ASSOC);
      if ($r && $r['peso_inicial'] !== null && $r['peso_atual'] !== null) {
        $valor = round((float)$r['peso_inicial'] - (float)$r['peso_atual'], 1);
        return ['valor' => max(0, $valor), 'unidade' => 'kg'];
      }
    } catch (\Throwable $e) { /* tabela pode não existir */ }

    // 2) fallback: tabela progresso (tipo='peso' ou 'peso_kg')
    try {
      $q2 = $this->pdo->prepare("SELECT MIN(valor) min_peso, MAX(valor) max_peso
                                 FROM progresso
                                 WHERE usuario_id=:u AND (tipo='peso' OR tipo='peso_kg')");
      $q2->execute([':u' => $usuarioId]);
      $r2 = $q2->fetch(PDO::FETCH_ASSOC);
      if ($r2 && $r2['min_peso'] !== null && $r2['max_peso'] !== null) {
        $valor = round((float)$r2['max_peso'] - (float)$r2['min_peso'], 1);
        return ['valor' => max(0, $valor), 'unidade' => 'kg'];
      }
    } catch (\Throwable $e) {}

    return ['valor' => 0, 'unidade' => 'kg'];
  }
}
