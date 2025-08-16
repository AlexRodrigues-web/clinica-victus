<?php
// backend/controllers/UsuariosController.php
require_once __DIR__ . '/_pdo.php';

class UsuariosController {

  // GET /usuarios/{id}/progresso-peso
  public function progressoPeso(int $usuarioId): void {
    try {
      $pdo = cv_get_pdo();

      $sql = "
        SELECT peso_inicial, peso_atual, atualizado_em
          FROM progresso_usuario
         WHERE usuario_id = :uid
         LIMIT 1
      ";
      $st = $pdo->prepare($sql);
      $st->execute([':uid' => $usuarioId]);
      $row = $st->fetch();

      if (!$row) {
        echo json_encode([
          'sucesso' => true,
          'valor'   => 0,
          'unidade' => 'kg',
          'total'   => 10,
          'peso_inicial' => null,
          'peso_atual'   => null,
        ]);
        return;
      }

      $pesoIni = (float)$row['peso_inicial'];
      $pesoAtu = (float)$row['peso_atual'];
      $perdido = max(0, round($pesoIni - $pesoAtu, 1));

      // para o teu chart (strokeDasharray = valor, total)
      // uso um total simbólico (meta) de 10kg se não houver melhor referência
      $total = 10;

      echo json_encode([
        'sucesso'       => true,
        'valor'         => $perdido,
        'unidade'       => 'kg',
        'total'         => $total,
        'peso_inicial'  => $pesoIni,
        'peso_atual'    => $pesoAtu,
        'atualizado_em' => $row['atualizado_em'] ?? null
      ]);
    } catch (Throwable $e) {
      http_response_code(500);
      echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
    }
  }
}
