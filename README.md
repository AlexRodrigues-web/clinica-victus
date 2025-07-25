# 🧠 Victus Academia

Sistema web completo de apoio a clínicas, focado na jornada de transformação dos pacientes. Inclui login seguro, dashboard com lembretes e eventos, biblioteca de vídeos e PDFs, controle de progresso, plano alimentar, e gestão de perfil.

---

## 📌 Sumário

- [ Sobre o Projeto](#-sobre-o-projeto)
- [ Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [ Estrutura do Projeto](#-estrutura-do-projeto)
- [ Instalação e Execução](#️-instalação-e-execução)
- [ Funcionalidades](#-funcionalidades)
- [ Autenticação](#-autenticação)
- [ Banco de Dados](#-banco-de-dados)
- [ Rotas da API](#️-rotas-da-api)
- [ Testes e Debug](#-testes-e-debug)
- [ Autor](#-autor)

---

##  Sobre o Projeto

Este projeto foi desenvolvido para uma avaliação técnica e representa uma plataforma funcional com:

- Login e autenticação por token
- Dashboard personalizado
- Biblioteca com conteúdos educativos (vídeo e PDF)
- Controle de progresso por usuário
- Perfil com edição de dados e preferências
- Painel responsivo com UX otimizada

---

##  Tecnologias Utilizadas

**Backend**  
- PHP 7.4+  
- PDO (MySQL/MariaDB)  
- Estrutura MVC  
- JSON e headers CORS  
- Autenticação por sessão/token

**Frontend**  
- HTML5 + CSS3  
- JavaScript  
- (React, Vue ou Flutter – modular conforme necessidade)

**Banco de Dados**  
- MariaDB / MySQL  
- phpMyAdmin para administração

---

## Estrutura do Projeto

clinica-victus/
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── config/
│ └── index.php
├── frontend/
│ ├── pages/
│ ├── components/
│ └── App.js
├── database/
│ └── script.sql
├── README.md
└── .env

##  Instalação e Execução

### 1. Clonar o projeto
```bash
git clone https://github.com/teu-usuario/clinica-victus.git
cd clinica-victus
2. Backend (PHP)
PHP 7.4 ou superior

Configurar backend/config/Conexao.php com os dados do seu banco

define('DB_HOST', 'localhost');
define('DB_NAME', 'clinica_victus');
define('DB_USER', 'root');
define('DB_PASS', '');
Rodar com Apache (XAMPP, Laragon ou outro)

3. Frontend (React ou HTML/CSS)
Navegue até a pasta frontend

npm install
npm start
4. Banco de Dados
Importe o script SQL localizado em database/script.sql no phpMyAdmin

 Funcionalidades
 Login seguro com email e senha

 Dashboard com lembrete do dia, eventos e progresso

 Biblioteca com vídeos e PDFs

 Controle de progresso do usuário

 Plano alimentar (wizard por etapas)

 Edição de perfil com foto

 Design responsivo e acessível

 Autenticação
Login via POST /login

Sessão ativa via cookies ou tokens

Proteção básica contra CSRF

Campos: email, senha

Credenciais de Teste:

Email: alex@victus.com
Senha: 123456
 Banco de Dados
Principais tabelas:

usuarios

biblioteca

video

progresso_video

lembretes

notificacoes

Use o arquivo database/script.sql para importar as tabelas.

 Rotas da API
 Autenticação
Método	Rota	Descrição
POST	/login	Login de usuário

 Biblioteca
Método	Rota	Descrição
GET	/biblioteca	Lista conteúdos disponíveis
GET	/biblioteca/progresso/{id}	Lista com progresso do usuário
POST	/biblioteca/adicionar	Adiciona novo conteúdo

Vídeo
| GET | /video/{biblioteca_id}/{uid} | Retorna detalhes dos vídeos do curso |

 Perfil
| GET | /perfil/{id} | Dados do perfil do usuário |
| POST | /perfil/foto | Upload da foto |
| PUT | /perfil | Edita dados pessoais |

Testes e Debug
Habilitado error_log() em todos os métodos críticos

Testar com Postman ou Insomnia

Códigos de erro bem definidos:

401 - Não autorizado

403 - Proibido

404 - Não encontrado

500 - Erro interno

 Autor
Desenvolvido por Alex
 Email: alex@victus.com
 LinkedIn • Portfólio • GitHub
 Portifólio: alexdevcode.com

Este projeto faz parte de uma avaliação técnica para a Victus. Foi estruturado de forma modular, segura e escalável, com foco em usabilidade e clareza de código.
