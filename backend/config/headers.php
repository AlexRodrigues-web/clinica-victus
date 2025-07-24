<?php
// backend/config/headers.php

// Permitir requisições de qualquer origem
header("Access-Control-Allow-Origin: *");

// Tipo de conteúdo JSON
header("Content-Type: application/json; charset=UTF-8");

// Métodos permitidos
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

// Cabeçalhos permitidos
header("Access-Control-Allow-Headers: Content-Type, Authorization");
