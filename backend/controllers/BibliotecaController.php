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
        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        // se vier tipo na URL e não no body, preenche
        if ($tipo && empty($input['tipo'])) {
            $input['tipo'] = $tipo;
        }

        // valida campos obrigatórios
        foreach (['titulo','url_arquivo','tipo'] as $campo) {
            if (empty($input[$campo])) {
                http_response_code(400);
                echo json_encode(['erro' => "Campo '{$campo}' é obrigatório"]);
                return;
            }
        }

        $data = [
            'titulo'      => $input['titulo'],
            'descricao'   => $input['descricao']   ?? '',
            'url_arquivo' => $input['url_arquivo'],
            'imagem_capa' => $input['imagem_capa'] ?? '',
            'tipo'        => $input['tipo'],
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

        $titulo = $_POST['titulo']   ?? '';
        $tipo   = $_POST['tipo']     ?? '';

        if (empty($titulo) || empty($tipo)) {
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
            mkdir(dirname($absPath), 0777, true);
        }

        if (!move_uploaded_file($arquivo['tmp_name'], $absPath)) {
            http_response_code(500);
            echo json_encode(['erro' => 'Erro ao salvar o arquivo']);
            return;
        }

        $data = [
            'titulo'      => $titulo,
            'descricao'   => $_POST['descricao'] ?? '',
            'url_arquivo' => $relPath,
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
}
