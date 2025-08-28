<?php
// backend/controllers/VideoPrefsController.php
require_once __DIR__ . '/../models/VideoPrefsModel.php';

class VideoPrefsController {
    private $model;

    public function __construct() {
        $this->model = new VideoPrefsModel();
        header('Content-Type: application/json; charset=utf-8');
    }

    // GET /prefs/{bibliotecaId}/{usuarioId}
    public function get($bibliotecaId, $usuarioId) {
        try {
            $prefs = $this->model->get((int)$bibliotecaId, (int)$usuarioId);
            echo json_encode(['sucesso'=>true, 'prefs'=>$prefs], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso'=>false, 'erro'=>$e->getMessage()]);
        }
    }

    // POST /prefs/set   body JSON (ou array passado pela rota)
    public function set($input = null) {
        // aceita tanto parâmetro vindo da rota quanto o corpo bruto
        $in = is_array($input) ? $input : (json_decode(file_get_contents('php://input'), true) ?: []);

        $bib = (int)($in['biblioteca_id'] ?? 0);
        $uid = (int)($in['usuario_id'] ?? 0);

        if ($bib <= 0 || $uid <= 0) {
            http_response_code(400);
            echo json_encode(['sucesso'=>false, 'erro'=>'Parâmetros inválidos']);
            return;
        }

        try {
            $saved = $this->model->upsert($bib, $uid, $in);
            echo json_encode(['sucesso'=>true, 'prefs'=>$saved], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso'=>false, 'erro'=>$e->getMessage()]);
        }
    }

    // PUT /prefs/{bibliotecaId}/{usuarioId}
    public function patch($bibliotecaId, $usuarioId) {
        $raw = file_get_contents('php://input');
        $in  = json_decode($raw, true) ?: [];
        try {
            $saved = $this->model->patch((int)$bibliotecaId, (int)$usuarioId, $in);
            echo json_encode(['sucesso'=>true, 'prefs'=>$saved], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['sucesso'=>false, 'erro'=>$e->getMessage()]);
        }
    }
}
