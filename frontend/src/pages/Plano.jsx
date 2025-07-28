// frontend/src/pages/Plano.jsx
import React, { useState } from 'react';
import Footer from '../components/Footer';
import './Plano.css';

export default function Plano() {
  const [etapa, setEtapa] = useState(1);
  const [dados, setDados] = useState({
    objetivo: '',
    rotina: '',
    estilo: '',
    refeicoes: ''
  });

  const avancar = () => setEtapa(etapa + 1);
  const voltar = () => setEtapa(etapa - 1);

  const handleSelecionar = (campo, valor) => {
    setDados({ ...dados, [campo]: valor });
    avancar();
  };

  const gerarPlano = () => {
    const { objetivo, rotina, estilo, refeicoes } = dados;

    if (objetivo === 'perda' && estilo === 'lowcarb') {
      return {
        nome: 'Plano Slim LowCarb',
        duracao: '8 semanas',
        fases: ['Desintoxicação', 'Reeducação', 'Manutenção'],
        descricao: 'Foco em queima de gordura com baixo consumo de carboidratos e alta saciedade.',
        dicas: [
          'Evite açúcar e massas refinadas',
          'Inclua legumes e proteínas magras',
          'Faça caminhadas diárias'
        ]
      };
    }

    if (objetivo === 'massa' && rotina === 'atleta') {
      return {
        nome: 'Plano Power Muscle',
        duracao: '12 semanas',
        fases: ['Hipertrofia Inicial', 'Fase de Carga', 'Manutenção'],
        descricao: 'Alto teor calórico com foco em proteínas, ideal para ganho de massa muscular.',
        dicas: [
          'Inclua whey protein e creatina',
          'Treine com peso 5x/semana',
          'Durma bem e hidrate-se'
        ]
      };
    }

    if (objetivo === 'saude' && estilo === 'tradicional') {
      return {
        nome: 'Plano Vitalidade 360',
        duracao: '6 semanas',
        fases: ['Ajuste Alimentar', 'Rotina Saudável', 'Vida Equilibrada'],
        descricao: 'Plano leve e sustentável para melhorar energia, disposição e bem-estar geral.',
        dicas: [
          'Inclua frutas e cereais integrais',
          'Evite refeições pesadas à noite',
          'Beba 2L de água por dia'
        ]
      };
    }

    return {
      nome: 'Plano Personalizado',
      duracao: '4 a 8 semanas',
      fases: ['Avaliação', 'Adaptação', 'Resultado'],
      descricao: 'Plano equilibrado com base nos teus objetivos e estilo alimentar.',
      dicas: [
        'Mantenha consistência',
        'Evite dietas radicais',
        'Respeite o teu tempo'
      ]
    };
  };

  const renderEtapa = () => {
    switch (etapa) {
      case 1:
        return (
          <div className="etapa">
            <h2>Qual o teu objetivo principal?</h2>
            <div className="opcoes">
              <button onClick={() => handleSelecionar('objetivo', 'perda')}>Perder Peso</button>
              <button onClick={() => handleSelecionar('objetivo', 'massa')}>Ganhar Massa</button>
              <button onClick={() => handleSelecionar('objetivo', 'saude')}>Saúde e Energia</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="etapa">
            <h2>Como está a tua rotina?</h2>
            <div className="opcoes">
              <button onClick={() => handleSelecionar('rotina', 'sedentario')}>Sedentário</button>
              <button onClick={() => handleSelecionar('rotina', 'ativo')}>Ativo</button>
              <button onClick={() => handleSelecionar('rotina', 'atleta')}>Atleta</button>
            </div>
            <button onClick={voltar} className="voltar">Voltar</button>
          </div>
        );
      case 3:
        return (
          <div className="etapa">
            <h2>Preferência alimentar?</h2>
            <div className="opcoes">
              <button onClick={() => handleSelecionar('estilo', 'lowcarb')}>Low Carb</button>
              <button onClick={() => handleSelecionar('estilo', 'vegano')}>Vegano</button>
              <button onClick={() => handleSelecionar('estilo', 'tradicional')}>Tradicional</button>
            </div>
            <button onClick={voltar} className="voltar">Voltar</button>
          </div>
        );
      case 4:
        return (
          <div className="etapa">
            <h2>Quantas refeições por dia?</h2>
            <div className="opcoes">
              <button onClick={() => handleSelecionar('refeicoes', '3')}>3 Refeições</button>
              <button onClick={() => handleSelecionar('refeicoes', '5')}>5 Refeições</button>
              <button onClick={() => handleSelecionar('refeicoes', 'jejum')}>Jejum intermitente</button>
            </div>
            <button onClick={voltar} className="voltar">Voltar</button>
          </div>
        );
      case 5:
        const plano = gerarPlano();
        return (
          <div className="etapa resultado animate">
            <h2>{plano.nome} 🎯</h2>

            <div className="bloco-info">
              <h4>⏳ Duração:</h4>
              <p>{plano.duracao}</p>
            </div>

            <div className="bloco-info">
              <h4>📋 Fases:</h4>
              <ul>
                {plano.fases.map((fase, idx) => (
                  <li key={idx}>🔹 {fase}</li>
                ))}
              </ul>
            </div>

            <div className="bloco-info">
              <h4>📝 Resumo:</h4>
              <p>{plano.descricao}</p>
            </div>

            <div className="bloco-info dicas">
              <h4>💡 Dicas:</h4>
              <ul>
                {plano.dicas.map((dica, idx) => (
                  <li key={idx}>✅ {dica}</li>
                ))}
              </ul>
            </div>

            <a
              href="https://api.whatsapp.com/send?phone=351963000455&text=Olá! Gostaria de começar o plano: Plano recomendado pelo app."
              target="_blank"
              rel="noreferrer"
              className="ativar-btn"
            >
              Quero este Plano
            </a>
            <br />
            <button onClick={() => setEtapa(1)} className="voltar">Refazer</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="plano-wizard">
      {renderEtapa()}
      
    </main>
  );
}
