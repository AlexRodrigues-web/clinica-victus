# 🧠 Victus Academia

Projeto desenvolvido como parte de um desafio técnico para avaliar a capacidade de estruturar soluções completas e funcionais (backend + frontend), com foco em arquitetura clara, organização do código e aderência visual/funcional.

---

## 📌 Sumário
- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Execução](#instalação-e-execução)
- [Scripts do Frontend (CRA)](#scripts-do-frontend-cra)
- [Funcionalidades](#funcionalidades)
- [Autenticação](#autenticação)
- [Banco de Dados](#banco-de-dados)
- [Rotas da API](#rotas-da-api)
- [Testes e Debug](#testes-e-debug)
- [Autor](#autor)

---

## Sobre o Projeto
Plataforma funcional com:
- Login e autenticação por token/sessão
- Dashboard personalizado
- Biblioteca com conteúdos educativos (vídeo e PDF)
- Controle de progresso por usuário
- Perfil com edição de dados e preferências
- Layout responsivo com UX otimizada

---

## Tecnologias Utilizadas

**Backend**
- PHP 7.4+
- PDO (MySQL/MariaDB)
- MVC
- JSON + CORS
- Sessão/Token

**Frontend**
- React (Create React App) **ou** HTML/CSS/JS
- HTML5 + CSS3 + JavaScript

**Banco de Dados**
- MariaDB / MySQL
- phpMyAdmin

---

## Estrutura do Projeto
```
clinica-victus/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── config/
│   └── index.php
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.js
│   └── package.json
├── database/
│   └── clinica_victus.sql
├── .env
└── README.md
```

---

## Instalação e Execução

### 1) Clonar o projeto
```bash
git clone https://github.com/teu-usuario/clinica-victus.git
cd clinica-victus
```

### 2) Backend (PHP)
- Requisitos: PHP 7.4+ e Apache (XAMPP, Laragon etc.)
- Configure `backend/config/Conexao.php` com seus dados:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'clinica_victus');
define('DB_USER', 'root');
define('DB_PASS', '');
```

> Alternativa com `.env`:
```
DB_HOST=localhost
DB_NAME=clinica_victus
DB_USER=root
DB_PASS=
```

- Suba o Apache (e o MySQL) e aponte o host virtual/pasta para `clinica-victus/backend` ou rode pelo `http://localhost/clinica-victus/backend`.

### 3) Frontend (React)
```bash
cd frontend
npm install
npm start
```
Abra `http://localhost:3000`.

### 4) Banco de Dados
- Importe `database/clinica_victus.sql` no phpMyAdmin.
- Ajuste credenciais conforme necessário.

---

## Scripts do Frontend (CRA)

Dentro de `clinica-victus/frontend`:

- `npm start` — desenvolvimento (hot reload em `http://localhost:3000`)
- `npm test` — testes em watch mode
- `npm run build` — build de produção em `frontend/build`
- `npm run eject` — **irreversível**; copia configs do CRA para customização total

Mais detalhes na documentação do CRA se necessário.

---

## Funcionalidades
- Login seguro com email e senha  
- Dashboard com lembretes, eventos e progresso  
- Biblioteca (vídeos/PDFs)  
- Controle de progresso do usuário  
- Plano alimentar (wizard por etapas)  
- Edição de perfil com foto  
- Design responsivo e acessível

---

## Autenticação
- **Login**: `POST /login`
- Sessão via cookies ou tokens
- Proteção básica contra CSRF
- **Campos**: `email`, `senha`

**Credenciais de teste**
```
Email: alex@victus.com
Senha: 123456
```

---

## Banco de Dados
Tabelas principais:
- `usuarios`
- `biblioteca`
- `video`
- `progresso_video`
- `lembretes`
- `notificacoes`

> Utilize `database/clinica_victus.sql` para importar a estrutura.

---

## Rotas da API

### Autenticação
| Método | Rota   | Descrição        |
|-------:|--------|------------------|
| POST   | /login | Login de usuário |

### Biblioteca
| Método | Rota                         | Descrição                      |
|-------:|------------------------------|--------------------------------|
| GET    | /biblioteca                  | Lista conteúdos disponíveis    |
| GET    | /biblioteca/progresso/{id}   | Progresso do usuário           |
| POST    | /biblioteca/adicionar        | Adiciona novo conteúdo         |

### Vídeo
| Método | Rota                              | Descrição                              |
|-------:|-----------------------------------|----------------------------------------|
| GET    | /video/{biblioteca_id}/{uid}      | Retorna detalhes dos vídeos do curso   |

### Perfil
| Método | Rota            | Descrição            |
|-------:|-----------------|----------------------|
| GET    | /perfil/{id}    | Dados do perfil      |
| POST   | /perfil/foto    | Upload da foto       |
| PUT    | /perfil         | Edita dados pessoais |

---

## Testes e Debug
- `error_log()` habilitado em métodos críticos
- Testes com Postman/Insomnia
- Códigos de erro:
  - `401` Não autorizado
  - `403` Proibido
  - `404` Não encontrado
  - `500` Erro interno

---

## Autor
Desenvolvido por **Alex**  
Email: **alex@victus.com**  
Portfólio: **alexdevcode.com**

> Este projeto faz parte de uma avaliação técnica para a Victus. Estruturado de forma modular, segura e escalável, com foco em usabilidade e clareza de código.
