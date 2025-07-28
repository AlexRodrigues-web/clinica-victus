import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await api.post('login', { email, senha });
      const { usuario, token } = response.data;

      // salvar no contexto (implementar se necessário)
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro no login:', err);
      setErro(err.response?.data?.erro || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Entra na tua conta</h2>

        <label>Email</label>
        <input
          type="email"
          placeholder="exemploemail@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Palavra-passe</label>
        <div className="password-wrapper">
          <input
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Inserir palavra-passe"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            title="Mostrar/ocultar palavra-passe"
          >
            👁️
          </span>
        </div>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </button>

        <p className="recuperar">
          Esqueceste-te da palavra-passe? <span>Recuperar</span>
        </p>

        <p className="termos">
          Ao utilizares a Victus, aceitas os nossos <br />
          <strong>Termos e Política de Privacidade.</strong>
        </p>
      </form>
    </div>
  );
}
