<?php
// backend/controllers/LembreteController.php
require_once __DIR__ . '/_pdo.php';

class LembreteController {
  // GET /lembrete/hoje/{usuarioId}
  public function hoje(int $usuarioId): void {
    try {
      $pdo = cv_get_pdo();
      // 1º tenta do usuário; se não houver, pega GLOBAL (usuario_id NULL/0)
      $sql = "
        (SELECT mensagem
           FROM lembretes
          WHERE data = CURDATE()
            AND usuario_id = :uid
          ORDER BY id DESC
          LIMIT 1)
        UNION ALL
        (SELECT mensagem
           FROM lembretes
          WHERE data = CURDATE()
            AND (usuario_id IS NULL OR usuario_id = 0)
          ORDER BY id DESC
          LIMIT 1)
        LIMIT 1
      ";
      $st = $pdo->prepare($sql);
      $st->execute([':uid' => $usuarioId]);
      $row = $st->fetch();

      echo json_encode([
        'sucesso'  => true,
        'mensagem' => $row['mensagem'] ?? null
      ]);
    } catch (Throwable $e) {
      http_response_code(500);
      echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
    }
  }
}
