<?php
// backend/helpers/validar_token.php
// extrai o token do header Authorization e retorna o $usuario_id ou false

function validar_token() {
    // espera um header assim: Authorization: Bearer SEU_TOKEN_AQUI
    $h = getallheaders();
    if (empty($h['Authorization'])) {
        return false;
    }
    $bearer = trim(str_ireplace('Bearer', '', $h['Authorization']));
    // aqui você faz a validação real do JWT (ou sessão)...
    // por enquanto, se quiser testar, devolva um ID fixo:
    // return 1;
    // se já tiver sua rotina de verificação de token JWT, utilize-a:
    try {
        // Exemplo com Firebase JWT ou outra lib:
        // $decoded = JWT::decode($bearer, 'SUA_CHAVE_SECRETA', ['HS256']);
        // return $decoded->sub;
        // —————————————
        // Para teste rápido, só faça:
        return 1; // id do usuário de teste
    } catch (Exception $e) {
        return false;
    }
}
