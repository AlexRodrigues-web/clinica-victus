<?php

require_once __DIR__ . '/../models/BibliotecaModel.php';

class BibliotecaController {
    private $model;

    public function __construct() {
        $this->model = new BibliotecaModel();
    }

    public function listar() {
        error_log("BibliotecaController::listar iniciado");
        try {
            $itens = $this->model->listarAtivos();
            echo json_encode([
                'sucesso' => true,
                'dados'   => $itens
            ]);
        } catch (Exception $e) {
            error_log("BibliotecaController::erro - " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao buscar biblioteca']);
        }
    }

    public function listarComProgresso(int $usuarioId) {
        error_log("BibliotecaController::listarComProgresso iniciado com usuario_id={$usuarioId}");
        try {
            $itens = $this->model->listarComProgresso($usuarioId);
            echo json_encode([
                'sucesso' => true,
                'dados'   => $itens
            ]);
        } catch (Exception $e) {
            error_log("BibliotecaController::erro progresso - " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao buscar biblioteca com progresso']);
        }
    }

    public function adicionar(string $tipo = null) {
        error_log("BibliotecaController::adicionar iniciado, tipo={$tipo}");
        $raw = file_get_contents('php://input');
        error_log("BibliotecaController::raw input: " . $raw);

        if (function_exists('getallheaders')) {
            error_log("BibliotecaController::headers: " . json_encode(getallheaders()));
        }

        $input = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("BibliotecaController::json_decode error: " . json_last_error_msg());
            $input = [];
        }
        error_log("BibliotecaController::decoded input: " . json_encode($input));

        if ($tipo && empty($input['tipo'])) {
            $input['tipo'] = $tipo;
        }

        foreach (['titulo','url_arquivo','tipo'] as $campo) {
            if (empty($input[$campo]) || !is_string($input[$campo]) || trim($input[$campo]) === '') {
                http_response_code(400);
                echo json_encode(['erro' => "Campo '{$campo}' é obrigatório"]);
                return;
            }
        }

        $data = [
            'titulo'      => trim($input['titulo']),
            'descricao'   => isset($input['descricao']) ? trim($input['descricao']) : '',
            'url_video'   => trim($input['url_arquivo']),
            'imagem_capa' => isset($input['imagem_capa']) ? trim($input['imagem_capa']) : '',
            'tipo'        => trim($input['tipo']),
        ];

        try {
            $registro = $this->model->adicionar($data);
            echo json_encode([
                'sucesso' => true,
                'dados'   => $registro
            ]);
        } catch (Exception $e) {
            error_log("BibliotecaController::erro adicionar - " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao adicionar item na biblioteca']);
        }
    }

    public function adicionarArquivo() {
        error_log("BibliotecaController::adicionarArquivo iniciado");

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['erro' => 'Método não permitido']);
            return;
        }

        $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
        $tipo   = isset($_POST['tipo']) ? trim($_POST['tipo']) : '';
        $descricao = isset($_POST['descricao']) ? trim($_POST['descricao']) : '';

        if ($titulo === '' || $tipo === '') {
            http_response_code(400);
            echo json_encode(['erro' => 'Título e tipo são obrigatórios']);
            return;
        }

        if (!isset($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['erro' => 'Falha no upload do arquivo']);
            return;
        }

        $arquivo    = $_FILES['arquivo'];
        $ext        = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
        $mime       = mime_content_type($arquivo['tmp_name']);
        $permitidos = [
            'pdf'  => 'application/pdf',
            'mp4'  => 'video/mp4',
            'mov'  => 'video/quicktime',
            'webm' => 'video/webm',
        ];

        if (!isset($permitidos[$ext]) || $permitidos[$ext] !== $mime) {
            http_response_code(400);
            echo json_encode(['erro' => 'Tipo de arquivo inválido']);
            return;
        }

        $uniq    = uniqid('bib_', true) . ".$ext";
        $relPath = '/uploads/biblioteca/' . $uniq;
        $absPath = __DIR__ . '/../../public' . $relPath;

        if (!is_dir(dirname($absPath))) {
            if (!mkdir(dirname($absPath), 0777, true) && !is_dir(dirname($absPath))) {
                error_log("BibliotecaController::falha ao criar diretório: " . dirname($absPath));
                http_response_code(500);
                echo json_encode(['erro' => 'Erro interno ao preparar armazenamento']);
                return;
            }
        }

        if (!move_uploaded_file($arquivo['tmp_name'], $absPath)) {
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao salvar o arquivo']);
            return;
        }

        $data = [
            'titulo'      => $titulo,
            'descricao'   => $descricao,
            'url_video'   => $relPath,
            'imagem_capa' => '',
            'tipo'        => $tipo,
        ];

        try {
            $registro = $this->model->adicionar($data);
            echo json_encode(['sucesso' => true, 'dados' => $registro]);
        } catch (Exception $e) {
            error_log("BibliotecaController::erro upload salvar - " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao salvar registro']);
        }
    }

    /**
     * Novo método: Detalhes com módulos, aulas, materiais, progresso
     */
    public function detalhesComModulos($bibliotecaId, $usuarioId) {
        error_log("BibliotecaController::detalhesComModulos iniciado. biblioteca={$bibliotecaId}, usuario={$usuarioId}");
        try {
            $detalhes = $this->model->getDetalhesComModulos($bibliotecaId, $usuarioId);
            echo json_encode([
                'sucesso' => true,
                'dados'   => $detalhes
            ]);
        } catch (Exception $e) {
            error_log("BibliotecaController::erro detalhesComModulos - " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao buscar detalhes da biblioteca']);
        }
    }
}
