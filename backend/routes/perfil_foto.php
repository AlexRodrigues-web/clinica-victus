<?php
// backend/routes/perfil_foto.php

require_once __DIR__ . '/../controllers/PerfilController.php';
$ctrl = new PerfilController();

$uid = isset($_REQUEST['usuario_id']) ? (int)$_REQUEST['usuario_id'] : 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!empty($_FILES['foto_perfil'])) {
        $ctrl->uploadFoto($uid, $_FILES['foto_perfil']);
    } else {
        http_response_code(400);
        echo json_encode(['erro'=>'Arquivo não enviado']);
    }
} else {
    http_response_code(405);
    echo json_encode(['erro'=>'Método não permitido']);
}
