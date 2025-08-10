<?php
// backend/index.php

// --- CORS (frontend em http://localhost:3000) ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=utf-8");

// LOG básico da requisição
error_log("index.php acessado: METHOD={$_SERVER['REQUEST_METHOD']} URI={$_SERVER['REQUEST_URI']} QS=".($_SERVER['QUERY_STRING'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $raw = file_get_contents('php://input');
    if ($raw) error_log("index.php RAW BODY: ".$raw);
}

// Pré-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- ROTA ---
$rota = $_GET['rota'] ?? null;
if (!$rota) {
    error_log("index.php - Nenhuma rota informada");
    http_response_code(400);
    echo json_encode(['erro' => 'Rota não especificada']);
    exit;
}

// Normaliza e separa
$partes     = array_values(array_filter(explode('/', trim($rota, '/'))));
$resource   = strtolower($partes[0] ?? '');
$parametros = array_slice($partes, 1);

error_log("index.php - Rota solicitada: {$resource} | Params: " . implode(',', $parametros));

// -----------------------------------------------------------
// PRIORIDADE MÁXIMA: rotas críticas tratadas AQUI MESMO
// -----------------------------------------------------------
try {
    switch ($resource) {
        case 'aulas': {
            error_log("index.php - Dispatch direto para AulasController");
            require_once __DIR__ . '/controllers/AulasController.php';
            $ctl = new AulasController();

            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // /aulas/tem/{bibliotecaId}
                if (count($parametros) >= 2 && strtolower($parametros[0]) === 'tem') {
                    $bib = (int)($parametros[1] ?? 0);
                    error_log("index.php[aulas] tem -> bib={$bib}");
                    $ctl->tem($bib);
                    exit;
                }
                // /aulas/detalhes/{bibliotecaId}/{usuarioId}
                if (count($parametros) >= 3 && strtolower($parametros[0]) === 'detalhes') {
                    $bib = (int)($parametros[1] ?? 0);
                    $uid = (int)($parametros[2] ?? 0);
                    error_log("index.php[aulas] detalhes -> bib={$bib} uid={$uid}");
                    $ctl->detalhes($bib, $uid);
                    exit;
                }
                http_response_code(400);
                echo json_encode(['erro' => 'Parâmetros inválidos para GET /aulas']);
                exit;
            }

            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // /aulas/progresso
                if (count($parametros) >= 1 && strtolower($parametros[0]) === 'progresso') {
                    error_log("index.php[aulas] progresso -> POST");
                    $ctl->atualizarProgresso();
                    exit;
                }
                http_response_code(400);
                echo json_encode(['erro' => 'Parâmetros inválidos para POST /aulas']);
                exit;
            }

            http_response_code(405);
            echo json_encode(['erro' => 'Método não permitido para /aulas']);
            exit;
        }

        case 'video': {
            error_log("index.php - Dispatch direto para VideoController");
            require_once __DIR__ . '/controllers/VideoController.php';
            $ctl = new VideoController();

            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // /video/detalhes/{bibliotecaId}/{usuarioId}
                if (count($parametros) >= 3 && strtolower($parametros[0]) === 'detalhes') {
                    $bib = (int)($parametros[1] ?? 0);
                    $uid = (int)($parametros[2] ?? 0);
                    error_log("index.php[video] detalhes -> bib={$bib} uid={$uid}");
                    $ctl->detalhes($bib, $uid);
                    exit;
                }
                // /video/{bibliotecaId}/{usuarioId}
                if (count($parametros) >= 2) {
                    $bib = (int)($parametros[0] ?? 0);
                    $uid = (int)($parametros[1] ?? 0);
                    error_log("index.php[video] detalhes (short) -> bib={$bib} uid={$uid}");
                    $ctl->detalhes($bib, $uid);
                    exit;
                }
                http_response_code(400);
                echo json_encode(['erro' => 'Parâmetros inválidos para GET /video']);
                exit;
            }

            http_response_code(405);
            echo json_encode(['erro' => 'Método não permitido para /video']);
            exit;
        }
    }
} catch (Throwable $e) {
    error_log("index.php - ERRO no dispatch direto: ".$e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno', 'detalhe' => $e->getMessage()]);
    exit;
}

// -----------------------------------------------------------
// SE NÃO CAIU NAS ROTAS CRÍTICAS ACIMA, TENTA routes/*.php
// -----------------------------------------------------------
$arquivoRota = $resource;
$caminho = __DIR__ . "/routes/{$arquivoRota}.php";
$GLOBALS['rotas_parametros'] = $parametros;

if (is_file($caminho)) {
    error_log("index.php - Rota via arquivo routes/{$arquivoRota}.php");
    require_once $caminho;
    exit;
}

// 404 para o resto
error_log("index.php - Rota não encontrada: {$arquivoRota}");
http_response_code(404);
echo json_encode(['erro' => 'Rota não encontrada']);
exit;
