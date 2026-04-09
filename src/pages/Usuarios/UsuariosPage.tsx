import React, { useState } from 'react';
import { UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { useAuth, gerarLogin } from '../../contexts/AuthContext';
import { usePin, PinModal } from '../../components/PinProtecao';
import styles from './Usuarios.module.css';

const CARGOS = ['Mecânico', 'Operador', 'Eletricista', 'Encanador', 'Pintor', 'Porteiro', 'Zelador', 'Técnico', 'Auxiliar', 'Outro'];

const UsuariosPage: React.FC = () => {
  const { listarFuncionarios, criarFuncionario, excluirFuncionario, usuario } = useAuth();
  const { aberto: pinAberto, pedirPin, onSucesso: pinSucesso, onFechar: pinFechar } = usePin();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome]   = useState('');
  const [cargo, setCargo] = useState('Mecânico');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [criado, setCriado] = useState<{ login: string; senha: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const funcionarios = listarFuncionarios();
  const loginPreview = gerarLogin(nome);

  const validar = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome obrigatório';
    if (!/^\d{6}$/.test(senha)) e.senha = 'Senha deve ter exatamente 6 dígitos numéricos';
    return e;
  };

  const handleCriar = () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }
    const result = criarFuncionario({ nome: nome.trim(), cargo, senha, adminId: usuario?.adminId });
    setCriado({ login: result.login, senha });
    setNome(''); setCargo('Mecânico'); setSenha(''); setErros({});
    setMostrarForm(false);
  };

  const copiarCredenciais = () => {
    if (!criado) return;
    navigator.clipboard.writeText(`Login: ${criado.login}\nSenha: ${criado.senha}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleExcluir = (id: string, nome: string) => {
    if (!confirm(`Excluir funcionário "${nome}"? Esta ação não pode ser desfeita.`)) return;
    excluirFuncionario(id);
  };

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerTitulo}>
          <span style={{ fontSize: 36 }}>👥</span>
          <div>
            <h1>Funcionários</h1>
            <p>Cadastre e gerencie os funcionários do sistema</p>
          </div>
        </div>
        <button className={styles.btnNovo} onClick={() => { setMostrarForm(true); setCriado(null); }}>
          <UserPlus size={18} /> Novo Funcionário
        </button>
      </div>

      {/* Credenciais do último criado */}
      {criado && (
        <div className={styles.credenciaisBox}>
          <div className={styles.credenciaisTitulo}>✅ Funcionário criado! Anote as credenciais:</div>
          <div className={styles.credenciaisGrid}>
            <div>
              <span className={styles.credLabel}>Login</span>
              <span className={styles.credValor}>{criado.login}</span>
            </div>
            <div>
              <span className={styles.credLabel}>Senha</span>
              <span className={styles.credValor}>{criado.senha}</span>
            </div>
          </div>
          <button className={styles.btnCopiar} onClick={copiarCredenciais}>
            {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar credenciais</>}
          </button>
        </div>
      )}

      {/* Formulário de criação */}
      {mostrarForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitulo}>Novo Funcionário</h2>

          <div className={styles.formGrupo}>
            <label className={styles.formLabel}>Nome completo *</label>
            <input
              className={`${styles.formInput} ${erros.nome ? styles.formInputErro : ''}`}
              placeholder="Ex: João Silva"
              value={nome}
              onChange={e => { setNome(e.target.value); setErros(p => ({...p, nome: ''})); }}
            />
            {erros.nome && <span className={styles.formErro}>{erros.nome}</span>}
            {nome && (
              <span className={styles.loginPreview}>
                Login gerado: <strong>{loginPreview}</strong>
              </span>
            )}
          </div>

          <div className={styles.formGrupo}>
            <label className={styles.formLabel}>Cargo *</label>
            <select
              className={styles.formInput}
              value={cargo}
              onChange={e => setCargo(e.target.value)}
            >
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.formGrupo}>
            <label className={styles.formLabel}>Senha (6 dígitos numéricos) *</label>
            <input
              className={`${styles.formInput} ${erros.senha ? styles.formInputErro : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Ex: 123456"
              value={senha}
              onChange={e => { setSenha(e.target.value.replace(/\D/g,'')); setErros(p => ({...p, senha: ''})); }}
            />
            {erros.senha && <span className={styles.formErro}>{erros.senha}</span>}
          </div>

          <div className={styles.formAcoes}>
            <button className={styles.btnCancelar} onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button className={styles.btnSalvar} onClick={handleCriar}>Criar Funcionário</button>
          </div>
        </div>
      )}

      {/* Lista de funcionários */}
      <div className={styles.lista}>
        {funcionarios.length === 0 ? (
          <div className={styles.vazio}>
            <span style={{ fontSize: 48 }}>👤</span>
            <p>Nenhum funcionário cadastrado</p>
            <p>Clique em "Novo Funcionário" para começar</p>
          </div>
        ) : (
          funcionarios.map(f => (
            <div key={f.id} className={styles.card}>
              <div className={styles.cardAvatar}>{f.nome.charAt(0).toUpperCase()}</div>
              <div className={styles.cardInfo}>
                <div className={styles.cardNome}>{f.nome}</div>
                <div className={styles.cardDetalhes}>
                  <span className={styles.cardCargo}>{f.cargo || 'Sem cargo'}</span>
                  <span className={styles.cardLogin}>🔑 {f.login}</span>
                </div>
              </div>
              <button
                className={styles.btnExcluir}
                onClick={() => pedirPin(() => handleExcluir(f.id, f.nome))}
                title="Excluir funcionário"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <PinModal aberto={pinAberto} onSucesso={pinSucesso} onFechar={pinFechar} />

    </div>
  );
};

export default UsuariosPage;
