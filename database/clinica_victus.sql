SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `clinica_victus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `clinica_victus`;

DROP TABLE IF EXISTS `biblioteca`;
CREATE TABLE IF NOT EXISTS `biblioteca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` varchar(255) NOT NULL,
  `imagem_capa` varchar(255) DEFAULT NULL,
  `data_publicacao` date DEFAULT curdate(),
  `ativo` tinyint(1) DEFAULT 1,
  `tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `biblioteca` (`id`, `titulo`, `descricao`, `url_video`, `imagem_capa`, `data_publicacao`, `ativo`, `tipo`) VALUES
(1, 'JOANAFLIX', 'Como fazer papas de aveia para emagrecer!', 'https://www.youtube.com/watch?v=5izl4L2TRWg', 'https://www.youtube.com/watch?v=5izl4L2TRWg', '2025-07-20', 1, NULL),
(2, 'guia de emagrecimento', 'Guia saudavel para quem quer emagrcer saudável.', 'https://www.saude.rj.gov.br/site/arq/Guia_Emagrecimento_Saudavel_4.pdf', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu5S2TJIZpMcv7mHSkI5KqSH6K_LqaG-iqKrrEELlucA12ugNPcMuyvLB7zb2QSKhiYcw&usqp=CAUhttps://www.saude.rj.gov.br/site/arq/Guia_Emagrecimento_Saudavel_4.pdf', '2025-07-20', 1, NULL);

DROP TABLE IF EXISTS `lembretes`;
CREATE TABLE IF NOT EXISTS `lembretes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensagem` mediumtext NOT NULL,
  `data` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `data` (`data`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `lembretes` (`id`, `mensagem`, `data`) VALUES
(1, 'Acredite: você é capaz de superar qualquer desafio...', '2025-07-22'),
(2, 'Seja grata pelo hoje e confiante no amanhã!', '2025-07-23'),
(3, 'Uma pequena ação hoje pode gerar um grande resultado amanhã.', '2025-07-24'),
(4, 'Cuide da sua mente, do seu corpo e do seu coração.', '2025-07-25'),
(5, 'Você está cada dia mais próxima da sua melhor versão.', '2025-07-26'),
(6, 'A constância vale mais que a intensidade.', '2025-07-27'),
(7, 'O segredo é começar mesmo sem vontade.', '2025-07-28'),
(8, 'Hoje é um ótimo dia para recomeçar.', '2025-07-29'),
(9, 'Não se compare, apenas evolua.', '2025-07-30'),
(10, 'Você já percorreu um longo caminho. Continue!', '2025-07-31'),
(11, 'Seu esforço de hoje é o seu resultado de amanhã.', '2025-08-01'),
(12, 'A disciplina te levará onde a motivação não chega.', '2025-08-02'),
(13, 'Respire fundo. Você está no caminho certo.', '2025-08-03'),
(14, 'Valorize cada pequena vitória do seu dia.', '2025-08-04'),
(15, 'A paciência também é um ato de coragem.', '2025-08-05'),
(16, 'Viva um dia de cada vez. Tudo se resolve.', '2025-08-06'),
(17, 'Você tem o poder de transformar a sua história.', '2025-08-07'),
(18, 'Não se cobre tanto. Você já faz o seu melhor.', '2025-08-08'),
(19, 'Mesmo devagar, você está avançando.', '2025-08-09'),
(20, 'Seja sua melhor amiga. Cuide-se com carinho.', '2025-08-10'),
(21, 'Confie no processo. Tudo tem seu tempo.', '2025-08-11'),
(22, 'Hoje é um novo capítulo. Escreva com amor.', '2025-08-12'),
(23, 'Nada muda se você não mudar. Comece agora!', '2025-08-13'),
(24, 'Seja a razão do seu próprio orgulho.', '2025-08-14'),
(25, 'Persistência hoje, vitória amanhã.', '2025-08-15'),
(26, 'Tenha f? em voc? e siga em frente.', '2025-08-16'),
(27, 'Lembre-se: sua sa?de ? o seu bem mais precioso.', '2025-08-17'),
(28, 'Tudo o que voc? precisa est? dentro de voc?.', '2025-08-18'),
(29, 'D? um passo de cada vez, mas nunca pare.', '2025-08-19'),
(30, 'Voc? merece o melhor. Acredite nisso todos os dias.', '2025-08-20');

DROP TABLE IF EXISTS `notificacoes`;
CREATE TABLE IF NOT EXISTS `notificacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `mensagem` text DEFAULT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `data` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `progresso`;
CREATE TABLE IF NOT EXISTS `progresso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `peso_perdido` decimal(5,2) DEFAULT 0.00,
  `data_registro` date DEFAULT curdate(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `progresso_usuario`;
CREATE TABLE IF NOT EXISTS `progresso_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `biblioteca_id` int(11) NOT NULL,
  `progresso_percentual` int(11) DEFAULT 0,
  `data_atualizacao` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`biblioteca_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `progresso_video`;
CREATE TABLE IF NOT EXISTS `progresso_video` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `percentual` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `nivel` enum('admin','cliente','nutricionista') DEFAULT 'cliente',
  `dt_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto_perfil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `nivel`, `dt_registro`, `foto_perfil`) VALUES
(1, 'Alex', 'alex@victus.com', '$2y$10$sBcwRkbb1pBzw/Xv0PvhMudsdSIzG.bHBFiDCNC05J/TOS8QA1RCS', 'admin', '2025-07-21 18:47:43', NULL);

DROP TABLE IF EXISTS `video`;
CREATE TABLE IF NOT EXISTS `video` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `biblioteca_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` varchar(500) NOT NULL,
  `ordem` int(11) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `bloqueado` tinyint(1) DEFAULT 0,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `video` (`id`, `biblioteca_id`, `titulo`, `descricao`, `url_video`, `ordem`, `modulo`, `bloqueado`, `ativo`) VALUES
(1, 1, 'Boas-vindas', 'Lorem ipsum...', 'https://youtu.be/abc', 1, 'Introdução', 0, 1),
(2, 1, 'Guias Alimentares', 'Lorem ipsum...', 'https://youtu.be/def', 2, 'Introdução', 0, 1),
(3, 1, 'Alimentação Saudável', 'Lorem ipsum...', 'https://youtu.be/ghi', 3, 'Avançado', 1, 1),
(4, 1, 'Emagrecimento', 'Descrição sobre emagrecimento...', 'https://youtu.be/jkl', 4, 'Avançado', 1, 1),
(5, 1, 'Planejamento Alimentar', 'Planejamento alimentar e rotinas', 'https://youtu.be/mno', 5, 'Avançado', 1, 1),
(6, 1, 'Como funciona a nutrição consciente', 'Uma introdução prática ao tema.', 'https://www.youtube.com/watch?v=3VFeG9QCSy0', 4, 'Introdução', 0, 1);

DROP TABLE IF EXISTS `videos`;
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url_video` text NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `videos` (`id`, `titulo`, `descricao`, `url_video`, `categoria`, `criado_em`) VALUES
(1, 'V?deo 1', 'Introdu??o ao tratamento', 'https://www.youtube.com/watch?v=abc123', NULL, '2025-07-21 21:29:59'),
(2, 'V?deo 2', 'Exerc?cios respirat?rios', 'https://www.youtube.com/watch?v=xyz456', NULL, '2025-07-21 21:29:59');


ALTER TABLE `progresso`
  ADD CONSTRAINT `progresso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
