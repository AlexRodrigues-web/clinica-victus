<?php
// backend/routes/prefs.php
// Roteador das preferências (favorito, like, concluído)
//
// Endpoints esperados pelo frontend:
//   GET  /prefs/{bibliotecaId}/{usuarioId}     -> retorna { favorite, liked, completed }
//   POST /prefs/set                            -> body JSON: { usuario_id, biblioteca_id, favorite?, liked?, completed? }

require_once __DIR__ . '/../controllers/VideoPrefsController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$params = $GLOBALS['rotas_parametros'] ?? [];

try {
    $ctl = new VideoPrefsController();

    if ($method === 'GET') {
        // /prefs/{bibliotecaId}/{usuarioId}
        if (count($params) >= 2 && ctype_digit((string)$params[0]) && ctype_digit((string)$params[1])) {
            $bib = (int)$params[0];
            $uid = (int)$params[1];
            $ctl->get($bib, $uid);
            return;
        }

        http_response_code(400);
        echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros inválidos para GET /prefs']);
        return;
    }

    if ($method === 'POST') {
        // /prefs/set
        if (count($params) >= 1 && strtolower($params[0]) === 'set') {
            $raw = file_get_contents('php://input');
            $input = json_decode($raw, true) ?: [];
            $ctl->set($input);
            return;
        }

        http_response_code(400);
        echo json_encode(['sucesso' => false, 'erro' => 'Parâmetros inválidos para POST /prefs']);
        return;
    }

    http_response_code(405);
    echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido para /prefs']);
} catch (Throwable $e) {
    error_log('[routes/prefs] ERRO: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'erro' => 'Erro interno', 'detalhe' => $e->getMessage()]);
}
