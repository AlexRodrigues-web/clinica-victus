<?php
// backend/index.php

/* =========================
 * CORS (dev-friendly)
 * ========================= */
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: {$origin}");
header("Vary: Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=utf-8");

/* =========================
 * LOG básico
 * ========================= */
error_log("index.php acessado: METHOD={$_SERVER['REQUEST_METHOD']} URI={$_SERVER['REQUEST_URI']} QS=".($_SERVER['QUERY_STRING'] ?? ''));
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $raw = file_get_contents('php://input');
    if ($raw) error_log("index.php RAW BODY: ".$raw);
}

/* =========================
 * Pré-flight
 * ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* =========================
 * Helpers
 * ========================= */
function json_ok($data){ http_response_code(200); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function json_bad($msg){ http_response_code(400); echo json_encode(['erro'=>$msg]); exit; }
function unauthorized($msg='Não autorizado'){ http_response_code(401); echo json_encode(['erro'=>$msg]); exit; }

function br_date(?string $iso): ?string {
    if (!$iso) return null;
    $d = substr($iso, 0, 10);
    $p = explode('-', $d);
    return count($p)===3 ? ($p[2].'/'.$p[1]) : $iso;
}

/* Fallbacks 200 (evitam 500) */
function fb_notif_contagens(){ json_ok(['grupos'=>0,'alertas'=>0,'mensagens'=>0]); }
function fb_notif_listar(){ json_ok(['itens'=>[]]); }
function fb_notif_proximos(){ json_ok(['itens'=>[]]); }
function fb_coment_listar(){ json_ok(['itens'=>[]]); }
function fb_coment_contagens(){ json_ok(['total'=>0]); }

/* Include controller seguro */
function safe_include_controller($path) {
    if (is_file($path)) {
        include_once $path; // include pra evitar fatal
        return true;
    }
    error_log("index.php - Controller ausente: {$path}");
    return false;
}

/* Util: obter token Bearer do header Authorization */
function bearer_token(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? '');
    if (!$h) return null;
    if (stripos($h, 'Bearer ') === 0) return trim(substr($h, 7));
    return null;
}

/* Util: obter PDO do projeto (database.php/db.php/config.php/conexao.php) ou fallback */
function get_pdo_from_project(): PDO {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) return $GLOBALS['pdo'];

    foreach ([__DIR__.'/database.php', __DIR__.'/db.php', __DIR__.'/config.php', __DIR__.'/config/conexao.php'] as $f) {
        if (is_file($f)) {
            include_once $f;
            if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) return $GLOBALS['pdo'];
            if (function_exists('getPDO'))   { $pdo = getPDO();   if ($pdo instanceof PDO) return $pdo; }
            if (function_exists('conectar')){ $pdo = conectar(); if ($pdo instanceof PDO) return $pdo; }
        }
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $db   = getenv('DB_NAME') ?: 'clinica_victus';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';
    $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec("SET NAMES utf8mb4");
    return $pdo;
}

/* =========================
 * Captura e normaliza rota
 * ========================= */
$rota = $_GET['rota'] ?? null;
if (!$rota) json_bad('Rota não especificada');

$rota = trim($rota);
$rota = trim($rota, "/ \t\n\r\0\x0B");
$partes     = array_values(array_filter(explode('/', $rota)));
$resource   = strtolower($partes[0] ?? '');
$parametros = array_slice($partes, 1);

error_log("index.php - Rota solicitada: {$resource} | Params: " . implode(',', $parametros));

/* =========================
 * ROTAS CRÍTICAS (com fallback)
 * ========================= */
switch ($resource) {

    /* -------------------------
     * LOGIN (encaminha direto)
     * ------------------------- */
    case 'login': {
        $arquivoRotaLogin = __DIR__ . "/routes/login.php";
        if (is_file($arquivoRotaLogin)) {
            require_once $arquivoRotaLogin;
            exit;
        }
        http_response_code(404);
        echo json_encode(['erro' => 'Rota login não encontrada']);
        exit;
    }

    /* -------------------------
     * SENHA (recuperar/redefinir)
     * ------------------------- */
   case 'senha': {
  $arquivoRota = __DIR__ . '/routes/senha.php';
  if (is_file($arquivoRota)) {
    $GLOBALS['rotas_parametros'] = $parametros; // ex.: ['recuperar'] ou ['redefinir']
    require_once $arquivoRota;
    exit;
  }
  http_response_code(404);
  echo json_encode(['erro'=>'Rota senha não encontrada']);
  exit;
}

    /* -------------------------
     * PERFIL
     * 1) Se existir routes/perfil.php (teu arquivo completo com validar_token), usa ele.
     * 2) Senão, faz um fallback real com tokens_auth (sem usuário fake).
     * ------------------------- */
    case 'perfil': {
        // (1) Encaminha para a rota dedicada, se existir
        $arquivoRotaPerfil = __DIR__ . "/routes/perfil.php";
        if (is_file($arquivoRotaPerfil)) {
            require_once $arquivoRotaPerfil;
            exit;
        }

        // (2) Fallback real sem dev-fake
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /perfil']); exit;
        }

        $token = bearer_token();
        if (!$token) unauthorized('Token ausente');

        try {
            $pdo = get_pdo_from_project();
            // garante tokens_auth
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS tokens_auth (
                  token      CHAR(32) PRIMARY KEY,
                  usuario_id INT NOT NULL,
                  criado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  expira_em  DATETIME NULL,
                  INDEX (usuario_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");

            $sql = "
                SELECT u.id, u.nome, u.email, u.nivel, u.dt_registro, u.foto_perfil
                FROM usuarios u
                JOIN tokens_auth t ON t.usuario_id = u.id
                WHERE t.token = :t
                  AND (t.expira_em IS NULL OR t.expira_em > NOW())
                LIMIT 1
            ";
            $st = $pdo->prepare($sql);
            $st->execute([':t' => $token]);
            $usr = $st->fetch();

            if (!$usr) unauthorized();

            $usuario = [
                'id'          => (int)$usr['id'],
                'nome'        => $usr['nome'] ?: ucfirst(strtok($usr['email'], '@')),
                'email'       => $usr['email'],
                'nivel'       => $usr['nivel'] ?? null,
                'dt_registro' => $usr['dt_registro'] ?? null,
                'foto_perfil' => $usr['foto_perfil'] ?? null,
                'avatar'      => $usr['foto_perfil'] ?? null,
            ];
            json_ok(['usuario' => $usuario]);
        } catch (Throwable $e) {
            error_log("perfil fallback erro: ".$e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Falha ao obter perfil']);
            exit;
        }
    }

    /* ------------------------- */
    case 'aulas': {
        if (!safe_include_controller(__DIR__ . '/controllers/AulasController.php') || !class_exists('AulasController')) {
            json_bad('Parâmetros inválidos para /aulas');
        }
        $ctl = new AulasController();

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if (count($parametros) >= 2 && strtolower($parametros[0]) === 'tem') {
                $ctl->tem( (int)($parametros[1] ?? 0) );
                exit;
            }
            if (count($parametros) >= 3 && strtolower($parametros[0]) === 'detalhes') {
                $ctl->detalhes( (int)($parametros[1] ?? 0), (int)($parametros[2] ?? 0) );
                exit;
            }
            json_bad('Parâmetros inválidos para GET /aulas');
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (count($parametros) >= 1 && strtolower($parametros[0]) === 'progresso') {
                $ctl->atualizarProgresso();
                exit;
            }
            json_bad('Parâmetros inválidos para POST /aulas');
        }

        http_response_code(405);
        echo json_encode(['erro'=>'Método não permitido para /aulas']);
        exit;
    }

    case 'video': {
        if (!safe_include_controller(__DIR__ . '/controllers/VideoController.php') || !class_exists('VideoController')) {
            json_bad('Controller de vídeo indisponível');
        }
        $ctl = new VideoController();

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if (count($parametros) >= 3 && strtolower($parametros[0]) === 'detalhes') {
                $ctl->detalhes( (int)($parametros[1] ?? 0), (int)($parametros[2] ?? 0) );
                exit;
            }
            if (count($parametros) >= 2) {
                $ctl->detalhes( (int)($parametros[0] ?? 0), (int)($parametros[1] ?? 0) );
                exit;
            }
            json_bad('Parâmetros inválidos para GET /video');
        }

        http_response_code(405);
        echo json_encode(['erro'=>'Método não permitido para /video']);
        exit;
    }

    /* =========================
     * DASHBOARD: SEM 500 AQUI
     * ========================= */
    case 'comentarios': {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /comentarios']); exit;
        }

        $ok = safe_include_controller(__DIR__ . '/controllers/ComentariosController.php');
        $temClasse = class_exists('ComentariosController');

        // /comentarios/listar/{usuarioId}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'listar') {
            if ($ok && $temClasse) {
                try { (new ComentariosController())->listar((int)$parametros[1]); exit; }
                catch (Throwable $e) { error_log("fallback /comentarios/listar: ".$e->getMessage()); fb_coment_listar(); }
            } else { fb_coment_listar(); }
        }

        // /comentarios/contagens/{usuarioId}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'contagens') {
            if ($ok && $temClasse) {
                try { (new ComentariosController())->contagens((int)$parametros[1]); exit; }
                catch (Throwable $e) { error_log("fallback /comentarios/contagens: ".$e->getMessage()); fb_coment_contagens(); }
            } else { fb_coment_contagens(); }
        }

        // variantes: /comentarios/{id}/listar e /comentarios/{id}
        if (count($parametros) >= 1) {
            if ($ok && $temClasse) {
                try {
                    if (isset($parametros[1]) && strtolower($parametros[1]) === 'listar') {
                        (new ComentariosController())->listar((int)$parametros[0]); exit;
                    }
                    (new ComentariosController())->listar((int)$parametros[0]); exit;
                } catch (Throwable $e) {
                    error_log("fallback /comentarios variante: ".$e->getMessage());
                    fb_coment_listar();
                }
            } else { fb_coment_listar(); }
        }

        http_response_code(404); echo json_encode(['erro'=>'Rota comentarios inválida']); exit;
    }

    case 'lembrete':
    case 'lembretes': {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /lembrete']); exit;
        }
        if (!safe_include_controller(__DIR__ . '/controllers/LembreteController.php') || !class_exists('LembreteController')) {
            json_ok(['itens'=>[]]);
        }
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'hoje') {
            try { (new LembreteController())->hoje((int)$parametros[1]); exit; }
            catch (Throwable $e) { error_log("fallback /lembrete/hoje: ".$e->getMessage()); json_ok(['itens'=>[]]); }
        }
        http_response_code(404); echo json_encode(['erro'=>'Rota de lembrete inválida']); exit;
    }

    case 'notificacoes': {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /notificacoes']); exit;
        }

        $ok = safe_include_controller(__DIR__ . '/controllers/NotificacoesController.php');
        $temClasse = class_exists('NotificacoesController');

        // /notificacoes/contagens/{usuarioId}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'contagens') {
            if ($ok && $temClasse) {
                try { (new NotificacoesController())->contagens((int)$parametros[1]); exit; }
                catch (Throwable $e) { error_log("fallback /notificacoes/contagens: ".$e->getMessage()); fb_notif_contagens(); }
            } else { fb_notif_contagens(); }
        }

        // /notificacoes/listar/{usuarioId}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'listar') {
            if ($ok && $temClasse) {
                try { (new NotificacoesController())->listar((int)$parametros[1]); exit; }
                catch (Throwable $e) { error_log("fallback /notificacoes/listar: ".$e->getMessage()); fb_notif_listar(); }
            } else { fb_notif_listar(); }
        }

        // /notificacoes/proximos/{usuarioId}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'proximos') {
            if ($ok && $temClasse) {
                try { (new NotificacoesController())->proximosEventos((int)$parametros[1]); exit; }
                catch (Throwable $e) { error_log("fallback /notificacoes/proximos: ".$e->getMessage()); fb_notif_proximos(); }
            } else { fb_notif_proximos(); }
        }

        http_response_code(404); echo json_encode(['erro'=>'Rota notificacoes inválida']); exit;
    }

    case 'eventos': {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /eventos']); exit;
        }

        $ok = safe_include_controller(__DIR__ . '/controllers/NotificacoesController.php');
        $temClasse = class_exists('NotificacoesController');

        // GET /eventos/proximos/{usuarioId?}
        if (count($parametros) >= 2 && strtolower($parametros[0]) === 'proximos') {
            $uid = (int)$parametros[1];
            if ($ok && $temClasse) {
                try { (new NotificacoesController())->proximosEventos($uid); exit; }
                catch (Throwable $e) { error_log("fallback /eventos/proximos: ".$e->getMessage()); fb_notif_proximos(); }
            } else { fb_notif_proximos(); }
        }

        // fallback globais
        if ($ok && $temClasse) {
            try { (new NotificacoesController())->proximosEventos(0); exit; }
            catch (Throwable $e) { error_log("fallback /eventos globais: ".$e->getMessage()); fb_notif_proximos(); }
        } else { fb_notif_proximos(); }
    }

    case 'dashboard': {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405); echo json_encode(['erro'=>'Método não permitido para /dashboard']); exit;
        }
        $acao = strtolower($parametros[0] ?? '');
        $uid  = (int)($parametros[1] ?? 0);

        if ($acao === 'contagens' && $uid > 0) {
            $ok = safe_include_controller(__DIR__ . '/controllers/NotificacoesController.php');
            if ($ok && class_exists('NotificacoesController')) {
                try { (new NotificacoesController())->contagens($uid); exit; }
                catch (Throwable $e) { error_log("fallback /dashboard/contagens: ".$e->getMessage()); fb_notif_contagens(); }
            } else { fb_notif_contagens(); }
        }

        if ($acao === 'progresso' && $uid > 0) {
            $ok = safe_include_controller(__DIR__ . '/controllers/UsuariosController.php');
            if ($ok && class_exists('UsuariosController')) {
                try { (new UsuariosController())->progressoPeso($uid); exit; }
                catch (Throwable $e) { error_log("fallback /dashboard/progresso: ".$e->getMessage()); json_ok(['itens'=>[]]); }
            } else { json_ok(['itens'=>[]]); }
        }

        http_response_code(404); echo json_encode(['erro'=>'Rota /dashboard inválida']); exit;
    }

    case 'usuarios': {
        if ($_SERVER['REQUEST_METHOD'] === 'GET' &&
            count($parametros) >= 2 &&
            strtolower($parametros[1]) === 'progresso-peso') {

            $ok = safe_include_controller(__DIR__ . '/controllers/UsuariosController.php');
            if ($ok && class_exists('UsuariosController')) {
                try { (new UsuariosController())->progressoPeso((int)$parametros[0]); exit; }
                catch (Throwable $e) { error_log("fallback /usuarios/progresso-peso: ".$e->getMessage()); json_ok(['itens'=>[]]); }
            } else { json_ok(['itens'=>[]]); }
        }
        // deixa seguir pra /routes/usuarios.php se existir
        break;
    }
}

/* =========================
 * FALLBACK PARA routes/*.php
 * ========================= */
$arquivoRota = $resource;
$__caminho = __DIR__ . "/routes/{$arquivoRota}.php";
$GLOBALS['rotas_parametros'] = $parametros;

if (is_file($__caminho)) {
    error_log("index.php - Rota via arquivo routes/{$arquivoRota}.php");
    require_once $__caminho;
    exit;
}

/* =========================
 * 404 para o resto
 * ========================= */
error_log("index.php - Rota não encontrada: {$arquivoRota}");
http_response_code(404);
echo json_encode(['erro' => 'Rota não encontrada']);
exit;
