<?php
require_once __DIR__ . '/../models/AulasModel.php';
require_once __DIR__ . '/../config/Conexao.php';

class AulasController {
    private $model;
    private $pdo;

    public function __construct() {
        $this->model = new AulasModel();
        $this->pdo   = Conexao::getConexao();
    }

    /** Resolve o curso real via curso_mapa; se não houver, retorna o próprio bibliotecaId. */
    private function resolveCursoId(int $bibliotecaId): int {
        try {
            $st = $this->pdo->prepare("SELECT curso_id FROM curso_mapa WHERE biblioteca_id = :bid LIMIT 1");
            $st->execute([':bid' => $bibliotecaId]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if ($row && (int)$row['curso_id'] > 0) {
                error_log("[AulasController::resolveCursoId] map {$bibliotecaId} -> {$row['curso_id']}");
                return (int)$row['curso_id'];
            }
        } catch (Throwable $e) {
            error_log("[AulasController::resolveCursoId] curso_mapa indisponível: ".$e->getMessage());
        }
        return $bibliotecaId;
    }

    /** Aula tem player válido? (embed_url OU url_video preenchidos) */
    private function hasPlayer(array $a): bool {
        $embed = trim((string)($a['embed_url'] ?? ''));
        $url   = trim((string)($a['url_video'] ?? ''));
        return $embed !== '' || $url !== '';
    }

    /**
     * Dedup simples:
     * - por módulo + ordem => fica o menor id
     * - se não houver 'ordem', dedup por módulo + título normalizado
     */
    private function dedupModulos(array $modulos): array {
        $out = [];
        foreach ($modulos as $moduloNome => $aulas) {
            $seenByKey = [];
            $dedup = [];
            foreach ($aulas as $a) {
                $ordem = isset($a['ordem']) ? (int)$a['ordem'] : null;
                $tituloNorm = mb_strtolower(trim($a['titulo'] ?? ''), 'UTF-8');
                $key = $ordem !== null ? "ordem:$ordem" : "titulo:$tituloNorm";
                if (!isset($seenByKey[$key])) {
                    $seenByKey[$key] = (int)$a['id'];
                    $dedup[] = $a;
                } else {
                    if ((int)$a['id'] < $seenByKey[$key]) {
                        $seenByKey[$key] = (int)$a['id'];
                        foreach ($dedup as $i => $row) {
                            $ordemRow = isset($row['ordem']) ? (int)$row['ordem'] : null;
                            $tituloRow = mb_strtolower(trim($row['titulo'] ?? ''), 'UTF-8');
                            $keyRow = $ordemRow !== null ? "ordem:$ordemRow" : "titulo:$tituloRow";
                            if ($keyRow === $key) {
                                $dedup[$i] = $a;
                                break;
                            }
                        }
                    }
                }
            }
            $out[$moduloNome] = $dedup;
        }
        return $out;
    }

    /**
     * GET /aulas/tem/{bibliotecaId}
     * Agora verifica se há AO MENOS UMA aula com player (embed_url ou url_video) no curso resolvido.
     */
    public function tem($bibliotecaId) {
        $bibliotecaId = (int)$bibliotecaId;
        $cursoId = $this->resolveCursoId($bibliotecaId);
        error_log("[AulasController::tem] IN bib={$bibliotecaId} => curso={$cursoId}");

        try {
            $sql = "
                SELECT 1
                FROM modulos m
                JOIN aulas a ON a.modulo_id = m.id
                WHERE m.biblioteca_id = :bid
                  AND (
                      (a.embed_url IS NOT NULL AND a.embed_url <> '')
                   OR (a.url_video IS NOT NULL AND a.url_video <> '')
                  )
                LIMIT 1
            ";
            $st = $this->pdo->prepare($sql);
            $st->execute([':bid' => $cursoId]);
            $tem = (bool)$st->fetchColumn();
        } catch (Throwable $e) {
            error_log("[AulasController::tem] ERRO: ".$e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso'=>false,'erro'=>$e->getMessage()]);
            return;
        }

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso'         => true,
            'tem'             => $tem,
            'curso_resolvido' => $cursoId,
            'bibliotecaId'    => $bibliotecaId
        ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    }

    public function detalhes($bibliotecaId, $usuarioId) {
        $bibliotecaId = (int)$bibliotecaId;
        $usuarioId    = (int)$usuarioId;

        $debug = isset($_GET['debug']) && $_GET['debug'] == '1';
        $from  = $_GET['from'] ?? null;

        error_log("[AulasController::detalhes] IN  bib={$bibliotecaId} user={$usuarioId} debug=".($debug?'1':'0')." from=".json_encode($from));

        $cursoId = $this->resolveCursoId($bibliotecaId);
        error_log("[AulasController::detalhes] curso_resolvido={$cursoId}");

        // 1) Biblioteca/curso
        try {
            $bib = $this->model->getBiblioteca($cursoId, $usuarioId);
            error_log("[AulasController::detalhes] getBiblioteca({$cursoId}) => ".json_encode($bib, JSON_UNESCAPED_UNICODE));
        } catch (Throwable $e) {
            error_log("[AulasController::detalhes] ERRO getBiblioteca: ".$e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso'=>false,'onde'=>'getBiblioteca','erro'=>$e->getMessage()]);
            return;
        }

        if (empty($bib)) {
            error_log("[AulasController::detalhes] NENHUMA biblioteca encontrada p/ id={$cursoId}");
            http_response_code(404);
            echo json_encode(['sucesso'=>false,'erro'=>'Conteúdo não encontrado']);
            return;
        }

        // 2) Módulos + aulas
        try {
            $modulos = $this->model->getModulosEAulas($cursoId, $usuarioId);
            $countMod = count($modulos);
            $countAulas = 0; foreach ($modulos as $k=>$v) { $countAulas += count($v); }
            error_log("[AulasController::detalhes] getModulosEAulas({$cursoId}) => modulos={$countMod} aulas={$countAulas}");
        } catch (Throwable $e) {
            error_log("[AulasController::detalhes] ERRO getModulosEAulas: ".$e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso'=>false,'onde'=>'getModulosEAulas','erro'=>$e->getMessage()]);
            return;
        }

        // 2.1) Dedup
        $modulosDedup = $this->dedupModulos($modulos);
        $countAulasDedup = 0; foreach ($modulosDedup as $k=>$v) { $countAulasDedup += count($v); }
        if ($countAulasDedup !== $countAulas) {
            error_log("[AulasController::detalhes] DEDUP aplicado: aulas {$countAulas} -> {$countAulasDedup}");
        }

        // 3) Calcular lista 'all' e 'playable'
        $all = [];
        foreach ($modulosDedup as $lista) foreach ($lista as $a) $all[] = $a;

        $playable = array_values(array_filter($all, function($a) {
            $embed = trim((string)($a['embed_url'] ?? ''));
            $url   = trim((string)($a['url_video'] ?? ''));
            return $embed !== '' || $url !== '';
        }));
        $countPlayable = count($playable);

        // 4) Escolher current_aula_id (preferindo apenas aulas tocáveis)
        $currentId = null;

        try {
            $ultima = $this->model->getUltimaAulaAssistida($cursoId, $usuarioId);
            error_log("[AulasController::detalhes] ultima_aula=".json_encode($ultima));
            if ($ultima && isset($ultima['aula_id'])) {
                $cand = (int)$ultima['aula_id'];
                foreach ($playable as $a) {
                    if ((int)$a['id'] === $cand) { $currentId = $cand; break; }
                }
            }
        } catch (Throwable $e) {
            error_log("[AulasController::detalhes] ERRO getUltimaAulaAssistida: ".$e->getMessage());
        }

        if ($currentId === null && !empty($playable)) {
            foreach ($playable as $a) {
                $prog = (float)($a['progresso'] ?? 0);
                $bloq = !empty($a['bloqueado']);
                if (!$bloq && $prog > 0 && $prog < 100) { $currentId = (int)$a['id']; break; }
            }
        }
        if ($currentId === null && !empty($playable)) {
            foreach ($playable as $a) {
                if (empty($a['bloqueado'])) { $currentId = (int)$a['id']; break; }
            }
        }
        if ($currentId === null && !empty($playable)) {
            $currentId = (int)$playable[0]['id'];
        }

        $resp = [
            'sucesso'         => true,
            'biblioteca'      => $bib,
            'modulos'         => $modulosDedup,     // mantém todas (inclusive sem player), frontend decide exibir/alertar
            'current_aula_id' => $currentId,        // sempre apontando para uma aula tocável (quando houver)
            'curso_resolvido' => $cursoId,
            'source'          => 'AulasController'
        ];

        if ($debug) {
            $porModulo = [];
            foreach ($modulosDedup as $nome => $lista) {
                $porModulo[$nome] = count($lista);
            }
            $resp['debug'] = [
                'in'                => ['bibliotecaId'=>$bibliotecaId, 'usuarioId'=>$usuarioId, 'from'=>$from],
                'curso_resolvido'   => $cursoId,
                'totais'            => ['modulos'=>count($modulosDedup), 'aulas'=>count($all), 'playable'=>$countPlayable],
                'por_modulo'        => $porModulo,
                'current_aula'      => $currentId,
                'first_modulo'      => array_key_first($modulosDedup),
                'first_aula'        => $all ? $all[0] : null,
                'first_playable_id' => $countPlayable ? $playable[0]['id'] : null,
            ];
        }

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($resp, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    }

    public function atualizarProgresso() {
        $raw = file_get_contents('php://input');
        error_log("[AulasController::atualizarProgresso] RAW = ".$raw);
        $in  = json_decode($raw, true) ?: [];

        $aulaId    = (int)($in['aula_id'] ?? 0);
        $usuarioId = (int)($in['usuario_id'] ?? 0);
        $pct       = (float)($in['percentual'] ?? 0);

        error_log("[AulasController::atualizarProgresso] IN aula={$aulaId} user={$usuarioId} pct={$pct}");

        if ($aulaId <= 0 || $usuarioId <= 0) {
            http_response_code(400);
            echo json_encode(['sucesso'=>false,'erro'=>'Parâmetros inválidos']);
            return;
        }

        $concluido = $pct >= 100 ? 1 : 0;

        try {
            $saved = $this->model->upsertProgressoAula($aulaId, $usuarioId, $pct, $concluido);
            echo json_encode(['sucesso'=>true,'dados'=>$saved]);
        } catch (Throwable $e) {
            error_log("[AulasController::atualizarProgresso] ERRO ".$e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso'=>false,'erro'=>$e->getMessage()]);
        }
    }
}
