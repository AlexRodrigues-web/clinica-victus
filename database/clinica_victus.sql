-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/08/2025 às 17:52
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `clinica_victus`
--

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `alertas`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `alertas` (
`id` int(11)
,`usuario_id` int(11)
,`titulo` varchar(255)
,`mensagem` mediumtext
,`data` datetime
);

-- --------------------------------------------------------

--
-- Estrutura para tabela `anotacoes`
--

CREATE TABLE `anotacoes` (
  `id` int(11) NOT NULL,
  `aula_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `conteudo` text DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `aulas`
--

CREATE TABLE `aulas` (
  `id` int(11) NOT NULL,
  `modulo_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` varchar(500) DEFAULT NULL,
  `embed_url` varchar(500) DEFAULT NULL,
  `ordem` int(11) DEFAULT 0,
  `bloqueado` tinyint(1) DEFAULT 0,
  `progresso` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `aulas`
--

INSERT INTO `aulas` (`id`, `modulo_id`, `titulo`, `descricao`, `url_video`, `embed_url`, `ordem`, `bloqueado`, `progresso`) VALUES
(6, 1, 'Introdução', 'Introdução ao curso', NULL, NULL, 1, 0, 100.00),
(7, 2, 'Guia básico', 'Guia alimentar básico', NULL, NULL, 1, 0, 0.00),
(8, 3, 'Comendo melhor', 'Dicas para alimentação saudável', NULL, NULL, 1, 1, 0.00),
(9, 4, 'Estratégias de emagrecimento', 'Métodos para emagrecer com saúde', NULL, NULL, 1, 1, 0.00),
(10, 5, 'Planejando refeições', 'Como planejar sua alimentação', NULL, NULL, 1, 1, 0.00),
(26, 18, 'Boas-vindas', 'Nesta primeira aula, você será apresentado(a) ao programa, entendendo a proposta, os objetivos e como aproveitar ao máximo o conteúdo das próximas etapas. É o momento de conhecer a metodologia, o formato das aulas e as orientações para que você tenha uma experiência transformadora durante o curso.', 'https://www.youtube.com/watch?v=5izl4L2TRWg', NULL, 1, 0, 0.00),
(27, 18, 'Métodos e princípios', 'Como vamos trabalhar nas próximas semanas.', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', NULL, 2, 1, 0.00),
(28, 19, 'Guias alimentares', 'Leituras e orientações práticas.', 'https://www.youtube.com/watch?v=hdgAP9XrlLA', NULL, 1, 1, 0.00),
(29, 20, 'Alimentação saudável', 'Pilares de uma rotina sustentável.', 'https://www.youtube.com/watch?v=BcX02TiHWWg', NULL, 1, 1, 0.00),
(30, 21, 'Estratégias de emagrecimento', 'Ferramentas para evoluir com segurança.', 'https://www.youtube.com/watch?v=4R9IwJIrBMY', NULL, 1, 1, 0.00),
(31, 22, 'Planeamento alimentar', 'Planeje sua semana na prática.', 'https://www.youtube.com/watch?v=OAYRvileKSg', NULL, 1, 1, 0.00),
(32, 18, 'Boas-vindas', 'Introdução ao programa.', 'https://www.youtube.com/watch?v=5izl4L2TRWg', NULL, 1, 0, 0.00),
(33, 18, 'Métodos e princípios', 'Como vamos trabalhar nas próximas semanas.', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', NULL, 2, 1, 0.00),
(34, 19, 'Guias alimentares', 'Leituras e orientações práticas.', 'https://www.youtube.com/watch?v=hdgAP9XrlLA', NULL, 1, 1, 0.00),
(35, 20, 'Alimentação saudável', 'Pilares de uma rotina sustentável.', 'https://www.youtube.com/watch?v=BcX02TiHWWg', NULL, 1, 1, 0.00),
(36, 21, 'Estratégias de emagrecimento', 'Ferramentas para evoluir com segurança.', 'https://www.youtube.com/watch?v=4R9IwJIrBMY', NULL, 1, 1, 0.00),
(37, 22, 'Planeamento alimentar', 'Planeje sua semana na prática.', 'https://www.youtube.com/watch?v=OAYRvileKSg', NULL, 1, 1, 0.00),
(39, 25, 'Boas-vindas', 'Introdução ao programa.', 'https://www.youtube.com/watch?v=5izl4L2TRWg', NULL, 1, 0, 0.00),
(40, 25, 'Métodos e princípios', 'Como vamos trabalhar nas próximas semanas.', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', NULL, 2, 1, 0.00),
(41, 26, 'Guias alimentares', 'Leituras e orientações práticas.', 'https://www.youtube.com/watch?v=hdgAP9XrlLA', NULL, 1, 1, 0.00),
(42, 27, 'Alimentação saudável', 'Pilares de uma rotina sustentável.', 'https://www.youtube.com/watch?v=BcX02TiHWWg', NULL, 1, 1, 0.00),
(43, 28, 'Estratégias de emagrecimento', 'Ferramentas para evoluir com segurança.', 'https://www.youtube.com/watch?v=4R9IwJIrBMY', NULL, 1, 1, 0.00),
(44, 29, 'Planeamento alimentar', 'Planeje sua semana na prática.', 'https://www.youtube.com/watch?v=OAYRvileKSg', NULL, 1, 1, 0.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `biblioteca`
--

CREATE TABLE `biblioteca` (
  `id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` varchar(255) NOT NULL,
  `imagem_capa` varchar(255) DEFAULT NULL,
  `data_publicacao` date DEFAULT curdate(),
  `ativo` tinyint(1) DEFAULT 1,
  `tipo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `biblioteca`
--

INSERT INTO `biblioteca` (`id`, `titulo`, `descricao`, `url_video`, `imagem_capa`, `data_publicacao`, `ativo`, `tipo`) VALUES
(1, 'JOANAFLIX', 'Como fazer papas de aveia para emagrecer!', 'https://www.youtube.com/watch?v=5izl4L2TRWg', 'https://www.youtube.com/watch?v=5izl4L2TRWg', '2025-07-20', 1, NULL),
(2, 'guia de emagrecimento', 'Guia saudavel para quem quer emagrcer saudável.', 'https://www.saude.rj.gov.br/site/arq/Guia_Emagrecimento_Saudavel_4.pdf', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu5S2TJIZpMcv7mHSkI5KqSH6K_LqaG-iqKrrEELlucA12ugNPcMuyvLB7zb2QSKhiYcw&usqp=CAUhttps://www.saude.rj.gov.br/site/arq/Guia_Emagrecimento_Saudavel_4.pdf', '2025-07-20', 1, NULL),
(3, 'Menopausa engorda?', '', 'https://www.youtube.com/shorts/zIzNC4qUatI', '', '2025-08-03', 1, 'video'),
(4, 'Como fazer papas de aveia para emagrecer!', '', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', '', '2025-08-03', 1, 'video'),
(6, 'Receitas de pequeno-almoço para emagrecer', '', 'https://www.youtube.com/watch?v=hdgAP9XrlLA', '', '2025-08-03', 1, 'video'),
(7, 'Receitas Saudáveis de Inverno', '', 'https://www.youtube.com/watch?v=BcX02TiHWWg', '', '2025-08-03', 1, 'video'),
(8, 'RECEITAS leves e PRÁTICAS para os dias quentes!', '', 'https://www.youtube.com/watch?v=4R9IwJIrBMY', '', '2025-08-03', 1, 'video'),
(9, 'Chás para emagrecer!', '', 'https://www.youtube.com/watch?v=OAYRvileKSg', '', '2025-08-03', 1, 'video'),
(10, 'O que ninguém te conta sobre emagrecer?', '', 'https://www.youtube.com/watch?v=LC-axIXMg7Y', '', '2025-08-03', 1, 'video'),
(12, 'Dicas para PERDER barriga!', '', 'https://www.youtube.com/watch?v=yeZ1NJJ_eno', '', '2025-08-03', 1, 'video'),
(13, 'Como fazer escolhas SAUDÁVEIS!', '', 'https://www.youtube.com/watch?v=i3kUfTOHXRo', '', '2025-08-03', 1, 'video'),
(14, 'Fome ou vontade de comer? Aprende a ouvir o teu corpo e evita comer por ansiedade', '', 'https://www.youtube.com/watch?v=xcYet1mV82s', '', '2025-08-03', 1, 'video'),
(19, 'O papel da nutrição na Autoestima', 'Neste episódio da JoanaFlix, exploramos como a alimentação influencia diretamente a autoestima, revelando dicas e hábitos que ajudam a melhorar a relação com o corpo e a mente.', 'https://www.youtube.com/watch?v=1VY3p_5mD6o', '', '2025-08-13', 1, 'video'),
(20, 'Como acelerar o metabolismo para emagrecer + rápido', '', 'https://www.youtube.com/watch?v=gHTKPa7C6tE', '', '2025-08-13', 1, 'video');

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `aula_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `conteudo` text DEFAULT NULL,
  `lido` tinyint(1) NOT NULL DEFAULT 0,
  `comentario` text NOT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `criado_em` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `comentarios`
--

INSERT INTO `comentarios` (`id`, `aula_id`, `usuario_id`, `titulo`, `conteudo`, `lido`, `comentario`, `data_criacao`, `criado_em`) VALUES
(3, 6, 1, 'Bem-vinda!', 'Estamos felizes em acompanhar seu progresso. Conte conosco!', 0, '', '2025-08-15 17:30:03', '2025-08-15 17:30:03'),
(4, 6, 1, 'Parab?ns!', '?timo desempenho esta semana - continue assim!', 0, '', '2025-08-15 17:30:03', '2025-08-15 17:30:03'),
(5, NULL, 1, 'Bem-vinda!', 'Estamos felizes em acompanhar seu progresso. Conte conosco!', 0, '', '2025-08-15 17:57:51', '2025-08-15 17:57:51'),
(6, NULL, 1, 'Parab?ns!', '?timo desempenho esta semana - continue assim!', 0, '', '2025-08-15 17:57:51', '2025-08-15 17:57:51');

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes_usuarios`
--

CREATE TABLE `configuracoes_usuarios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `notificacoes` tinyint(1) DEFAULT 1,
  `idioma` varchar(10) DEFAULT 'pt'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_mapa`
--

CREATE TABLE `curso_mapa` (
  `biblioteca_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `curso_mapa`
--

INSERT INTO `curso_mapa` (`biblioteca_id`, `curso_id`) VALUES
(3, 6),
(4, 6),
(6, 6),
(7, 6),
(8, 6),
(9, 6),
(10, 6),
(11, 6),
(12, 6),
(13, 6),
(14, 6),
(15, 6);

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `eventos`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `eventos` (
`id` int(11)
,`usuario_id` int(11)
,`titulo` varchar(255)
,`descricao` mediumtext
,`inicio` datetime
,`data` datetime
,`local` varchar(255)
);

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `grupos`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `grupos` (
`id` int(11)
,`usuario_id` int(11)
,`titulo` varchar(255)
,`mensagem` mediumtext
,`data` datetime
);

-- --------------------------------------------------------

--
-- Estrutura para tabela `lembretes`
--

CREATE TABLE `lembretes` (
  `id` int(11) NOT NULL,
  `mensagem` mediumtext NOT NULL,
  `data` date NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `lembretes`
--

INSERT INTO `lembretes` (`id`, `mensagem`, `data`, `usuario_id`, `created_at`) VALUES
(1, 'Acredite: você é capaz de superar qualquer desafio...', '2025-07-22', NULL, '2025-08-15 16:44:28'),
(2, 'Seja grata pelo hoje e confiante no amanhã!', '2025-07-23', NULL, '2025-08-15 16:44:28'),
(3, 'Uma pequena ação hoje pode gerar um grande resultado amanhã.', '2025-07-24', NULL, '2025-08-15 16:44:28'),
(4, 'Cuide da sua mente, do seu corpo e do seu coração.', '2025-07-25', NULL, '2025-08-15 16:44:28'),
(5, 'Você está cada dia mais próxima da sua melhor versão.', '2025-07-26', NULL, '2025-08-15 16:44:28'),
(6, 'A constância vale mais que a intensidade.', '2025-07-27', NULL, '2025-08-15 16:44:28'),
(7, 'O segredo é começar mesmo sem vontade.', '2025-07-28', NULL, '2025-08-15 16:44:28'),
(8, 'Hoje é um ótimo dia para recomeçar.', '2025-07-29', NULL, '2025-08-15 16:44:28'),
(9, 'Não se compare, apenas evolua.', '2025-07-30', NULL, '2025-08-15 16:44:28'),
(10, 'Você já percorreu um longo caminho. Continue!', '2025-07-31', NULL, '2025-08-15 16:44:28'),
(11, 'Seu esforço de hoje é o seu resultado de amanhã.', '2025-08-01', NULL, '2025-08-15 16:44:28'),
(12, 'A disciplina te levará onde a motivação não chega.', '2025-08-02', NULL, '2025-08-15 16:44:28'),
(13, 'Respire fundo. Você está no caminho certo.', '2025-08-03', NULL, '2025-08-15 16:44:28'),
(14, 'Valorize cada pequena vitória do seu dia.', '2025-08-04', NULL, '2025-08-15 16:44:28'),
(15, 'A paciência também é um ato de coragem.', '2025-08-05', NULL, '2025-08-15 16:44:28'),
(16, 'Viva um dia de cada vez. Tudo se resolve.', '2025-08-06', NULL, '2025-08-15 16:44:28'),
(17, 'Você tem o poder de transformar a sua história.', '2025-08-07', NULL, '2025-08-15 16:44:28'),
(18, 'Não se cobre tanto. Você já faz o seu melhor.', '2025-08-08', NULL, '2025-08-15 16:44:28'),
(19, 'Mesmo devagar, você está avançando.', '2025-08-09', NULL, '2025-08-15 16:44:28'),
(20, 'Seja sua melhor amiga. Cuide-se com carinho.', '2025-08-10', NULL, '2025-08-15 16:44:28'),
(21, 'Confie no processo. Tudo tem seu tempo.', '2025-08-11', NULL, '2025-08-15 16:44:28'),
(22, 'Hoje é um novo capítulo. Escreva com amor.', '2025-08-12', NULL, '2025-08-15 16:44:28'),
(23, 'Nada muda se você não mudar. Comece agora!', '2025-08-13', NULL, '2025-08-15 16:44:28'),
(24, 'Seja a razão do seu próprio orgulho.', '2025-08-14', NULL, '2025-08-15 16:44:28'),
(25, 'Você consegue! Foque no objetivo hoje ??', '2025-08-15', 1, '2025-08-15 16:44:28'),
(26, 'Tenha fé em você e siga em frente.', '2025-08-16', NULL, '2025-08-15 16:44:28'),
(27, 'Lembre-se: sua saúde é o seu bem mais precioso.', '2025-08-17', NULL, '2025-08-15 16:44:28'),
(28, 'Tudo o que você precisa está dentro de você .', '2025-08-18', NULL, '2025-08-15 16:44:28'),
(29, 'Dê um passo de cada vez, mas nunca pare.', '2025-08-19', NULL, '2025-08-15 16:44:28'),
(30, 'Você merece o melhor. Acredite nisso todos os dias.', '2025-08-20', NULL, '2025-08-15 16:44:28'),
(67, 'Seu foco é seu superpoder.', '2025-08-21', NULL, '2025-08-15 16:44:28'),
(68, 'Celebre o progresso, não a perfeição.', '2025-08-22', NULL, '2025-08-15 16:44:28'),
(69, 'Siga firme: o resultado virá.', '2025-08-23', NULL, '2025-08-15 16:44:28'),
(70, 'Acalme a mente, mova o corpo, nutra o coração.', '2025-08-24', NULL, '2025-08-15 16:44:28'),
(71, 'O que você pratica cresce. Pratique o bem.', '2025-08-25', NULL, '2025-08-15 16:44:28'),
(72, 'Comprometa-se com a sua meta por 10 minutos.', '2025-08-26', NULL, '2025-08-15 16:44:28'),
(73, 'Você é mais resiliente do que imagina.', '2025-08-27', NULL, '2025-08-15 16:44:28'),
(74, 'Comece pelo simples. O resto flui.', '2025-08-28', NULL, '2025-08-15 16:44:28'),
(75, 'Hoje, escolha coragem em vez de medo.', '2025-08-29', NULL, '2025-08-15 16:44:28'),
(76, 'Seja gentil com seu ritmo.', '2025-08-30', NULL, '2025-08-15 16:44:28'),
(77, 'Gratidão abre portas — anote três motivos hoje.', '2025-08-31', NULL, '2025-08-15 16:44:28');

-- --------------------------------------------------------

--
-- Estrutura para tabela `materiais`
--

CREATE TABLE `materiais` (
  `id` int(11) NOT NULL,
  `aula_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `arquivo_url` varchar(500) DEFAULT NULL,
  `data_upload` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `modulos`
--

CREATE TABLE `modulos` (
  `id` int(11) NOT NULL,
  `biblioteca_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `ordem` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `modulos`
--

INSERT INTO `modulos` (`id`, `biblioteca_id`, `nome`, `ordem`) VALUES
(1, 1, '1 | Bem-vindas', 1),
(2, 1, '2 | Guias Alimentares', 2),
(3, 1, '3 | Alimentação Saudável', 3),
(4, 1, '4 | Emagrecimento', 4),
(5, 1, '5 | Planeamento Alimentar', 5),
(13, 3, '1 | Bem-vindas', 1),
(14, 3, '2 | Guias Alimentares', 2),
(15, 3, '3 | Alimentação Saudável', 3),
(16, 3, '4 | Emagrecimento', 4),
(17, 3, '5 | Planeamento Alimentar', 5),
(18, 6, '1 | Bem-vindas', 1),
(19, 6, '2 | Guias Alimentares', 2),
(20, 6, '3 | Alimentação Saudável', 3),
(21, 6, '4 | Emagrecimento', 4),
(22, 6, '5 | Planeamento Alimentar', 5),
(25, 4, '1 | Bem-vindas', 1),
(26, 4, '2 | Guias Alimentares', 2),
(27, 4, '3 | Alimentação Saudável', 3),
(28, 4, '4 | Emagrecimento', 4),
(29, 4, '5 | Planeamento Alimentar', 5);

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes`
--

CREATE TABLE `notificacoes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `mensagem` text DEFAULT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `data` datetime DEFAULT current_timestamp(),
  `tipo` varchar(20) NOT NULL,
  `corpo` text DEFAULT NULL,
  `texto` text DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `inicio` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `local` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `notificacoes`
--

INSERT INTO `notificacoes` (`id`, `usuario_id`, `titulo`, `mensagem`, `lida`, `data`, `tipo`, `corpo`, `texto`, `descricao`, `inicio`, `created_at`, `local`) VALUES
(1, 0, 'Masterclass', 'Masterclass', 0, '2025-08-20 00:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(2, 0, 'Workshop', 'Workshop', 0, '2025-09-14 00:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(3, 1, 'Atualização', 'Seu plano foi atualizado', 0, '2025-08-15 16:44:44', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(4, 1, 'Consulta de retorno', NULL, 0, '2025-08-20 09:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(5, 1, 'Sessão de acompanhamento', NULL, 0, '2025-08-22 14:30:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(6, 1, 'Workshop de Nutrição', NULL, 0, '2025-09-01 18:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(7, 1, 'Novo grupo: Hábitos Saudáveis', 'Participe e compartilhe seu progresso.', 0, '2025-08-15 17:11:42', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(8, 1, 'Grupo: Desafio 21 dias', 'Inscrições abertas! Vagas limitadas.', 0, '2025-08-15 17:11:42', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(9, 1, 'Beba água ??', 'Hidrate-se agora para manter o foco!', 0, '2025-08-15 17:11:42', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(10, 1, 'Lembrete de refeição', 'Faça um lanche leve e equilibrado.', 0, '2025-08-15 18:11:42', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL),
(15, 1, 'Beba água ??', 'Hidrate-se agora para manter o foco!', 0, '2025-08-15 17:57:51', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 20:46:42', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes_backup_rollback`
--

CREATE TABLE `notificacoes_backup_rollback` (
  `id` int(11) NOT NULL DEFAULT 0,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensagem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `data` datetime DEFAULT current_timestamp(),
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `corpo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `texto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inicio` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `local` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `notificacoes_backup_rollback`
--

INSERT INTO `notificacoes_backup_rollback` (`id`, `usuario_id`, `titulo`, `mensagem`, `lida`, `data`, `tipo`, `corpo`, `texto`, `descricao`, `inicio`, `created_at`, `local`) VALUES
(1, 0, 'Masterclass', 'Masterclass', 0, '2025-08-20 00:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(2, 0, 'Workshop', 'Workshop', 0, '2025-09-14 00:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(3, 1, 'Atualização', 'Seu plano foi atualizado', 0, '2025-08-15 16:44:44', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(4, 1, 'Consulta de retorno', NULL, 0, '2025-08-20 09:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(5, 1, 'Sessão de acompanhamento', NULL, 0, '2025-08-22 14:30:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(6, 1, 'Workshop de Nutrição', NULL, 0, '2025-09-01 18:00:00', 'evento', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(7, 1, 'Novo grupo: H?bitos Saud?veis', 'Participe e compartilhe seu progresso.', 0, '2025-08-15 17:11:42', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(8, 1, 'Grupo: Desafio 21 dias', 'Inscrições abertas! Vagas limitadas.', 0, '2025-08-15 17:11:42', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(9, 1, 'Beba água ??', 'Hidrate-se agora para manter o foco!', 0, '2025-08-15 17:11:42', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(10, 1, 'Lembrete de refeição', 'Faça um lanche leve e equilibrado.', 0, '2025-08-15 18:11:42', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(11, 1, 'Novo grupo: Hábitos Saudáveis', 'Participe e compartilhe seu progresso.', 0, '2025-08-15 17:21:19', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(13, 1, 'Novo grupo: Hábitos Saudáveis', 'Participe e compartilhe seu progresso.', 0, '2025-08-15 17:29:55', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(14, 1, 'Novo grupo: H?bitos Saud?veis', 'Participe e compartilhe seu progresso.', 0, '2025-08-15 17:57:51', 'grupo', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL),
(15, 1, 'Beba ?gua ??', 'Hidrate-se agora para manter o foco!', 0, '2025-08-15 17:57:51', 'alerta', NULL, NULL, NULL, NULL, '2025-08-15 18:54:52', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token_plain` varchar(128) DEFAULT NULL,
  `token_hash` char(64) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `planos`
--

CREATE TABLE `planos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `objetivo` varchar(255) DEFAULT NULL,
  `duracao` varchar(50) DEFAULT NULL,
  `progresso` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso`
--

CREATE TABLE `progresso` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `peso_perdido` decimal(5,2) DEFAULT 0.00,
  `data_registro` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso_aula`
--

CREATE TABLE `progresso_aula` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `aula_id` int(11) NOT NULL,
  `percentual` decimal(5,2) NOT NULL DEFAULT 0.00,
  `concluido` tinyint(1) NOT NULL DEFAULT 0,
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `progresso_aula`
--

INSERT INTO `progresso_aula` (`id`, `usuario_id`, `aula_id`, `percentual`, `concluido`, `atualizado_em`) VALUES
(1, 1, 26, 100.00, 1, '2025-08-13 20:08:19'),
(17, 1, 27, 100.00, 1, '2025-08-11 22:44:25'),
(18, 1, 28, 100.00, 1, '2025-08-11 22:44:26'),
(19, 1, 29, 100.00, 1, '2025-08-11 22:44:27'),
(20, 1, 30, 50.00, 1, '2025-08-15 21:19:48');

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso_usuario`
--

CREATE TABLE `progresso_usuario` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `biblioteca_id` int(11) NOT NULL,
  `progresso_percentual` int(11) DEFAULT 0,
  `data_atualizacao` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `peso_inicial` decimal(6,2) DEFAULT NULL,
  `peso_atual` decimal(6,2) DEFAULT NULL,
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `progresso_usuario`
--

INSERT INTO `progresso_usuario` (`id`, `usuario_id`, `biblioteca_id`, `progresso_percentual`, `data_atualizacao`, `peso_inicial`, `peso_atual`, `atualizado_em`) VALUES
(1, 1, 0, 0, '2025-08-15 16:45:12', 78.50, 76.20, '2025-08-15 16:45:12');

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso_video`
--

CREATE TABLE `progresso_video` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `percentual` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `senha_reset`
--

CREATE TABLE `senha_reset` (
  `token` char(32) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `senha_resets`
--

CREATE TABLE `senha_resets` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `token` char(32) NOT NULL,
  `codigo` char(6) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tokens_auth`
--

CREATE TABLE `tokens_auth` (
  `token` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tokens_auth`
--

INSERT INTO `tokens_auth` (`token`, `usuario_id`, `criado_em`, `expira_em`) VALUES
('17945ec63ab70c16797f0431c4a2d813', 1, '2025-08-16 16:43:14', '2025-09-15 16:43:14');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tokens_reset`
--

CREATE TABLE `tokens_reset` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `token` char(32) NOT NULL,
  `codigo` char(6) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `expira_em` datetime DEFAULT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `email` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `nivel` enum('admin','cliente','nutricionista') DEFAULT 'cliente',
  `dt_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `nivel`, `dt_registro`, `foto_perfil`) VALUES
(1, 'Alex', 'alex@victus.com', '$2y$10$sBcwRkbb1pBzw/Xv0PvhMudsdSIzG.bHBFiDCNC05J/TOS8QA1RCS', 'admin', '2025-07-21 18:47:43', 'uploads/fotos/perfil_1_1755351501.jpg');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_video_prefs`
--

CREATE TABLE `usuario_video_prefs` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `biblioteca_id` int(11) NOT NULL,
  `favorite` tinyint(1) NOT NULL DEFAULT 0,
  `liked` tinyint(1) NOT NULL DEFAULT 0,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario_video_prefs`
--

INSERT INTO `usuario_video_prefs` (`id`, `usuario_id`, `biblioteca_id`, `favorite`, `liked`, `completed`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 0, 0, 1, '2025-08-13 19:54:34', '2025-08-13 19:55:01'),
(6, 1, 6, 1, 1, 0, '2025-08-13 19:57:26', '2025-08-13 20:08:31'),
(16, 1, 19, 0, 1, 0, '2025-08-13 20:58:28', '2025-08-15 22:38:57');

-- --------------------------------------------------------

--
-- Estrutura para tabela `video`
--

CREATE TABLE `video` (
  `id` int(11) NOT NULL,
  `biblioteca_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` varchar(500) NOT NULL,
  `ordem` int(11) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `bloqueado` tinyint(1) DEFAULT 0,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `video`
--

INSERT INTO `video` (`id`, `biblioteca_id`, `titulo`, `descricao`, `url_video`, `ordem`, `modulo`, `bloqueado`, `ativo`) VALUES
(1, 1, 'Boas-vindas', 'Lorem ipsum...', 'https://youtu.be/abc', 1, 'Introdução', 0, 1),
(2, 1, 'Guias Alimentares', 'Lorem ipsum...', 'https://youtu.be/def', 2, 'Introdução', 0, 1),
(3, 1, 'Alimentação Saudável', 'Lorem ipsum...', 'https://youtu.be/ghi', 3, 'Avançado', 1, 1),
(4, 1, 'Emagrecimento', 'Descrição sobre emagrecimento...', 'https://youtu.be/jkl', 4, 'Avançado', 1, 1),
(5, 1, 'Planejamento Alimentar', 'Planejamento alimentar e rotinas', 'https://youtu.be/mno', 5, 'Avançado', 1, 1),
(6, 1, 'Como funciona a nutrição consciente', 'Uma introdução prática ao tema.', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', 4, 'Introdução', 0, 1);

-- --------------------------------------------------------

--
-- Estrutura para view `alertas`
--
DROP TABLE IF EXISTS `alertas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `alertas`  AS SELECT `notificacoes`.`id` AS `id`, `notificacoes`.`usuario_id` AS `usuario_id`, `notificacoes`.`titulo` AS `titulo`, coalesce(`notificacoes`.`mensagem`,`notificacoes`.`corpo`,`notificacoes`.`texto`,`notificacoes`.`descricao`,'') AS `mensagem`, coalesce(`notificacoes`.`data`,`notificacoes`.`created_at`) AS `data` FROM `notificacoes` WHERE `notificacoes`.`tipo` = 'alerta' ;

-- --------------------------------------------------------

--
-- Estrutura para view `eventos`
--
DROP TABLE IF EXISTS `eventos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `eventos`  AS SELECT `notificacoes`.`id` AS `id`, `notificacoes`.`usuario_id` AS `usuario_id`, `notificacoes`.`titulo` AS `titulo`, coalesce(`notificacoes`.`descricao`,`notificacoes`.`mensagem`,`notificacoes`.`corpo`,`notificacoes`.`texto`,'') AS `descricao`, coalesce(`notificacoes`.`inicio`,`notificacoes`.`data`,`notificacoes`.`created_at`) AS `inicio`, coalesce(`notificacoes`.`inicio`,`notificacoes`.`data`,`notificacoes`.`created_at`) AS `data`, `notificacoes`.`local` AS `local` FROM `notificacoes` WHERE `notificacoes`.`tipo` = 'evento' ;

-- --------------------------------------------------------

--
-- Estrutura para view `grupos`
--
DROP TABLE IF EXISTS `grupos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `grupos`  AS SELECT `notificacoes`.`id` AS `id`, `notificacoes`.`usuario_id` AS `usuario_id`, `notificacoes`.`titulo` AS `titulo`, coalesce(`notificacoes`.`mensagem`,`notificacoes`.`corpo`,`notificacoes`.`texto`,`notificacoes`.`descricao`,'') AS `mensagem`, coalesce(`notificacoes`.`data`,`notificacoes`.`created_at`) AS `data` FROM `notificacoes` WHERE `notificacoes`.`tipo` = 'grupo' ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `anotacoes`
--
ALTER TABLE `anotacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aula_id` (`aula_id`);

--
-- Índices de tabela `aulas`
--
ALTER TABLE `aulas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `modulo_id` (`modulo_id`);

--
-- Índices de tabela `biblioteca`
--
ALTER TABLE `biblioteca`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comentarios_ibfk_1` (`aula_id`);

--
-- Índices de tabela `configuracoes_usuarios`
--
ALTER TABLE `configuracoes_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `curso_mapa`
--
ALTER TABLE `curso_mapa`
  ADD PRIMARY KEY (`biblioteca_id`);

--
-- Índices de tabela `lembretes`
--
ALTER TABLE `lembretes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `data` (`data`),
  ADD KEY `idx_lembretes_usuario_data` (`usuario_id`,`data`);

--
-- Índices de tabela `materiais`
--
ALTER TABLE `materiais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aula_id` (`aula_id`);

--
-- Índices de tabela `modulos`
--
ALTER TABLE `modulos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `biblioteca_id` (`biblioteca_id`);

--
-- Índices de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_usuario_data` (`usuario_id`,`data`),
  ADD KEY `idx_notif_tipo` (`tipo`),
  ADD KEY `idx_notif_tipo_uid` (`tipo`,`usuario_id`),
  ADD KEY `idx_notif_datas` (`data`,`inicio`,`created_at`);

--
-- Índices de tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_hash` (`token_hash`);

--
-- Índices de tabela `planos`
--
ALTER TABLE `planos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `progresso`
--
ALTER TABLE `progresso`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `progresso_aula`
--
ALTER TABLE `progresso_aula`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_aula` (`usuario_id`,`aula_id`),
  ADD UNIQUE KEY `uq_progresso_aula_usuario_aula` (`usuario_id`,`aula_id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_aula` (`aula_id`);

--
-- Índices de tabela `progresso_usuario`
--
ALTER TABLE `progresso_usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`biblioteca_id`),
  ADD UNIQUE KEY `uq_progresso_usuario` (`usuario_id`);

--
-- Índices de tabela `progresso_video`
--
ALTER TABLE `progresso_video`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`video_id`);

--
-- Índices de tabela `senha_reset`
--
ALTER TABLE `senha_reset`
  ADD PRIMARY KEY (`token`);

--
-- Índices de tabela `senha_resets`
--
ALTER TABLE `senha_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`),
  ADD KEY `token` (`token`),
  ADD KEY `codigo` (`codigo`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `tokens_auth`
--
ALTER TABLE `tokens_auth`
  ADD PRIMARY KEY (`token`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `tokens_reset`
--
ALTER TABLE `tokens_reset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_token` (`token`),
  ADD UNIQUE KEY `uq_codigo` (`codigo`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `usuario_video_prefs`
--
ALTER TABLE `usuario_video_prefs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_bib` (`usuario_id`,`biblioteca_id`),
  ADD KEY `idx_bib` (`biblioteca_id`);

--
-- Índices de tabela `video`
--
ALTER TABLE `video`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `anotacoes`
--
ALTER TABLE `anotacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `aulas`
--
ALTER TABLE `aulas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de tabela `biblioteca`
--
ALTER TABLE `biblioteca`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de tabela `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `configuracoes_usuarios`
--
ALTER TABLE `configuracoes_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `lembretes`
--
ALTER TABLE `lembretes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT de tabela `materiais`
--
ALTER TABLE `materiais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `modulos`
--
ALTER TABLE `modulos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `planos`
--
ALTER TABLE `planos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `progresso`
--
ALTER TABLE `progresso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `progresso_aula`
--
ALTER TABLE `progresso_aula`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de tabela `progresso_usuario`
--
ALTER TABLE `progresso_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `progresso_video`
--
ALTER TABLE `progresso_video`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `senha_resets`
--
ALTER TABLE `senha_resets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tokens_reset`
--
ALTER TABLE `tokens_reset`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `usuario_video_prefs`
--
ALTER TABLE `usuario_video_prefs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de tabela `video`
--
ALTER TABLE `video`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `anotacoes`
--
ALTER TABLE `anotacoes`
  ADD CONSTRAINT `anotacoes_ibfk_1` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `aulas`
--
ALTER TABLE `aulas`
  ADD CONSTRAINT `aulas_ibfk_1` FOREIGN KEY (`modulo_id`) REFERENCES `modulos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `configuracoes_usuarios`
--
ALTER TABLE `configuracoes_usuarios`
  ADD CONSTRAINT `configuracoes_usuarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `materiais`
--
ALTER TABLE `materiais`
  ADD CONSTRAINT `materiais_ibfk_1` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `modulos`
--
ALTER TABLE `modulos`
  ADD CONSTRAINT `modulos_ibfk_1` FOREIGN KEY (`biblioteca_id`) REFERENCES `biblioteca` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `progresso`
--
ALTER TABLE `progresso`
  ADD CONSTRAINT `progresso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `progresso_aula`
--
ALTER TABLE `progresso_aula`
  ADD CONSTRAINT `fk_prog_aula_aula` FOREIGN KEY (`aula_id`) REFERENCES `aulas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prog_aula_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuario_video_prefs`
--
ALTER TABLE `usuario_video_prefs`
  ADD CONSTRAINT `fk_uvp_bib` FOREIGN KEY (`biblioteca_id`) REFERENCES `biblioteca` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_uvp_user` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
