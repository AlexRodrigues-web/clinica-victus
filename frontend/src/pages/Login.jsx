import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Recuperação
  const [showRecover, setShowRecover] = useState(false);
  const [recEmail, setRecEmail] = useState('');
  const [recStep, setRecStep] = useState(1); // 1: solicitar, 2: redefinir
  const [recCodigo, setRecCodigo] = useState(''); // 6 dígitos
  const [recTokenAdv, setRecTokenAdv] = useState(''); // opcional (avançado)
  const [recNewPass, setRecNewPass] = useState('');
  const [mostrarRecSenha, setMostrarRecSenha] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recMsg, setRecMsg] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false); // esconde token por padrão

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const r = await api.post('login', { email, senha });
      const { usuario, token } = r.data || {};
      if (!usuario || !token) throw new Error('Resposta inválida do servidor');
      login(usuario, token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro no login:', err);
      setErro(err.response?.data?.erro || err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Passo 1: solicitar
  const solicitarRecuperacao = async () => {
    if (!recEmail) { setRecMsg('Informe o e-mail.'); return; }
    setRecLoading(true); setRecMsg('');
    try {
      await api.post('senha/recuperar', { email: recEmail });
      // resposta sempre genérica — seguimos para o passo 2
      setRecStep(2);
      setRecMsg('Enviámos instruções para redefinir a palavra-passe (verifica o teu e-mail).');
    } catch (e) {
      console.error(e);
      setRecMsg(e.response?.data?.erro || 'Não foi possível iniciar a recuperação.');
    } finally {
      setRecLoading(false);
    }
  };

  // Passo 2: redefinir
  const redefinirSenha = async () => {
    if (!recNewPass) { setRecMsg('Informe a nova palavra-passe.'); return; }
    if (!recCodigo && !recTokenAdv) { setRecMsg('Informe o código de 6 dígitos (ou use token avançado).'); return; }

    const payload = recCodigo && /^\d{6}$/.test(recCodigo.trim())
      ? { codigo: recCodigo.trim(), nova_senha: recNewPass, confirmar_senha: recNewPass }
      : { token: recTokenAdv.trim(), nova_senha: recNewPass, confirmar_senha: recNewPass };

    setRecLoading(true); setRecMsg('');
    try {
      const r = await api.post('senha/redefinir', payload);
      setRecMsg(r.data?.mensagem || 'Palavra-passe atualizada. Já podes entrar.');
      setTimeout(() => {
        setShowRecover(false);
        setRecStep(1);
        setRecEmail('');
        setRecCodigo('');
        setRecTokenAdv('');
        setRecNewPass('');
        setMostrarRecSenha(false);
        setShowAdvanced(false);
      }, 1200);
    } catch (e) {
      console.error(e);
      setRecMsg(e.response?.data?.erro || 'Não foi possível redefinir a palavra-passe.');
    } finally {
      setRecLoading(false);
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
            aria-label="Palavra-passe"
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setMostrarSenha(v => !v)}
            aria-label={mostrarSenha ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
            aria-pressed={mostrarSenha}
            title="Mostrar/ocultar palavra-passe"
          >
            {mostrarSenha ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </button>

        <p className="recuperar">
          Esqueceste-te da palavra-passe?{' '}
          <span
            role="button"
            tabIndex={0}
            onClick={() => { setShowRecover(true); setRecStep(1); setRecMsg(''); }}
            onKeyDown={(e) => e.key === 'Enter' && setShowRecover(true)}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            Recuperar
          </span>
        </p>

        <p className="termos">
          Ao utilizares a Victus, aceitas os nossos <br />
          <strong>Termos e Política de Privacidade.</strong>
        </p>
      </form>

      {/* Modal de recuperação */}
      {showRecover && (
        <div
          className="modal-overlay"
          onClick={() => setShowRecover(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Recuperar palavra-passe</h3>

            {recStep === 1 && (
              <>
                <label>Email da conta</label>
                <input
                  type="email"
                  placeholder="teuemail@dominio.com"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={solicitarRecuperacao}
                  disabled={recLoading || !recEmail}
                  style={{ marginTop: 10 }}
                >
                  {recLoading ? 'A enviar...' : 'Enviar instruções'}
                </button>
                {!!recMsg && <p style={{ marginTop: 10 }}>{recMsg}</p>}
              </>
            )}

            {recStep === 2 && (
              <>
                <p style={{ fontSize: 14, opacity: 0.85 }}>
                  Introduz o <strong>código de 6 dígitos</strong> recebido por e-mail e escolhe uma nova palavra-passe.
                </p>

                <label>Código (6 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="------"
                  value={recCodigo}
                  onChange={(e) => setRecCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />

                <label>Nova palavra-passe</label>
                <div className="password-wrapper">
                  <input
                    type={mostrarRecSenha ? 'text' : 'password'}
                    placeholder="nova palavra-passe"
                    value={recNewPass}
                    onChange={(e) => setRecNewPass(e.target.value)}
                    aria-label="Nova palavra-passe"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setMostrarRecSenha(v => !v)}
                    aria-label={mostrarRecSenha ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    aria-pressed={mostrarRecSenha}
                    title="Mostrar/ocultar palavra-passe"
                  >
                    {mostrarRecSenha ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(v => !v)}
                    style={{ background: 'transparent', color: '#777', width: 'auto', padding: '6px 8px' }}
                    aria-expanded={showAdvanced}
                  >
                    {showAdvanced ? 'Esconder token (avançado)' : 'Usar token (avançado)'}
                  </button>
                </div>

                {showAdvanced && (
                  <>
                    <label>Token</label>
                    <input
                      type="text"
                      placeholder="cole aqui o token (opcional)"
                      value={recTokenAdv}
                      onChange={(e) => setRecTokenAdv(e.target.value)}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={redefinirSenha}
                  disabled={recLoading || (!recCodigo && !recTokenAdv) || !recNewPass}
                  style={{ marginTop: 10 }}
                >
                  {recLoading ? 'A guardar...' : 'Redefinir'}
                </button>

                {!!recMsg && <p style={{ marginTop: 10 }}>{recMsg}</p>}
              </>
            )}

            <button
              type="button"
              onClick={() => setShowRecover(false)}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
