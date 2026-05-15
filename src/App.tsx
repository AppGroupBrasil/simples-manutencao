import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Wrench, Inbox, LogOut, LayoutDashboard } from 'lucide-react';
import TutorialWidget from './components/Tutorial/TutorialWidget';
import styles from './NavBar.module.css';

const LandingPage      = React.lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage        = React.lazy(() => import('./pages/Auth/LoginPage'));
const CadastroPage     = React.lazy(() => import('./pages/Auth/CadastroPage'));
const ResetSenhaPage   = React.lazy(() => import('./pages/Auth/ResetSenhaPage'));
const ManutencaoPage   = React.lazy(() => import('./pages/Manutencao/ManutencaoPage'));
const FormPage         = React.lazy(() => import('./pages/Manutencao/FormPage'));
const MeusChamadosPage = React.lazy(() => import('./pages/MeusChamados/MeusChamadosPage'));
const UsuariosPage     = React.lazy(() => import('./pages/Usuarios/UsuariosPage'));
const ChecklistPage    = React.lazy(() => import('./pages/Checklist/ChecklistPage'));
const ContratoPage     = React.lazy(() => import('./pages/Contrato/ContratoPage'));
const PropostaPage     = React.lazy(() => import('./pages/Proposta/PropostaPage'));
const DashboardPage    = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
const QRCodesPage      = React.lazy(() => import('./pages/QRCodes/QRCodesPage'));
const DocumentosPage   = React.lazy(() => import('./pages/Documentos/DocumentosPage'));
const DocumentoDownloadPage = React.lazy(() => import('./pages/Documentos/DocumentoDownloadPage'));
const ChecklistFillPage = React.lazy(() => import('./pages/Checklist/ChecklistFillPage'));
const OSAssistenciaTecnicaPage = React.lazy(() => import('./pages/Manutencao/OSAssistenciaTecnicaPage'));
const OSPublicaPage = React.lazy(() => import('./pages/Manutencao/OSPublicaPage'));
const ChamadoPublicoPage = React.lazy(() => import('./pages/Manutencao/ChamadoPublicoPage'));
const TutorialPage = React.lazy(() => import('./pages/Tutorial/TutorialPage'));

const DocDownloadWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <DocumentoDownloadPage docId={id || ''} />;
};

const ChecklistFillWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ChecklistFillPage checklistId={id || ''} />;
};

const Loader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
    <div style={{ width:40, height:40, border:'3px solid #eee', borderTop:'3px solid #FFD600', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
  </div>
);

const NavBar: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = usuario?.role || 'funcionario';
  const itens = [
    { path: '/dashboard',     label: 'Dashboard',     icon: <LayoutDashboard size={20} />, iconSm: <LayoutDashboard size={22} />, sempre: role === 'master' },
    { path: '/manutencao',    label: 'Manutenção',    icon: <Wrench size={20} />,          iconSm: <Wrench size={22} />,          sempre: true },
    { path: '/meus-chamados', label: 'Chamados',      icon: <Inbox size={20} />,           iconSm: <Inbox size={22} />,           sempre: true },
  ].filter(i => i.sempre);

  return (
    <>
      {/* ── Barra superior ── */}
      <nav className={styles.topBar}>
        <div className={styles.logo}>
          <img src="/logos/simples-manutencao.png?v=2" alt="Logo" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        {/* Nav desktop */}
        <div className={styles.navBtns}>
          {itens.map(item => (
            <button
              key={item.path}
              className={`${styles.navBtn} ${location.pathname === item.path ? styles.navBtnAtivo : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className={styles.userArea}>
          {usuario && <span className={styles.userName}>{usuario.nome}</span>}
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }} title="Sair">
            <LogOut size={17} /> <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* ── Barra inferior (mobile) ── */}
      <nav className={styles.bottomNav}>
        {itens.map(item => (
          <button
            key={item.path}
            className={`${styles.bottomBtn} ${location.pathname === item.path ? styles.bottomBtnAtivo : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.iconSm}
            <span className={styles.bottomBtnLabel}>{item.label}</span>
          </button>
        ))}
        <button
          className={styles.bottomBtn}
          onClick={() => { logout(); navigate('/login'); }}
          title="Sair"
        >
          <LogOut size={22} />
          <span className={styles.bottomBtnLabel}>Sair</span>
        </button>
      </nav>

      {/* Espaçador para o conteúdo não ficar atrás da nav inferior */}
      <div className={styles.bottomSpacer} />
    </>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, carregando } = useAuth();
  const location = useLocation();
  if (carregando) return <Loader />;
  if (!usuario) {
    // Salva a URL pretendida para redirecionar após o login
    const dest = location.pathname + location.search;
    if (dest !== '/login') sessionStorage.setItem('sm_redirect', dest);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const BotaoWhatsApp: React.FC = () => (
  <a
    href="https://wa.me/5511933284364?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20o%20Simples%20Manuten%C3%A7%C3%A3o."
    target="_blank"
    rel="noopener noreferrer"
    title="Falar com suporte no WhatsApp"
    style={{
      position: 'fixed',
      bottom: 113,
      left: 20,
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: '#25D366',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
      zIndex: 500,
      transition: 'transform 0.2s, box-shadow 0.2s',
      textDecoration: 'none',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(37,211,102,0.65)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,211,102,0.5)';
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  </a>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <NavBar />
    <div style={{ padding: '24px 20px', maxWidth: 1000, margin: '0 auto' }}>
      {children}
    </div>
    <BotaoWhatsApp />
    <TutorialWidget />
  </>
);

const App: React.FC = () => {
  const { usuario, carregando } = useAuth();
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          !carregando && usuario ? <Navigate to="/manutencao" replace /> : <LoginPage />
        } />
        <Route path="/cadastro" element={
          !carregando && usuario ? <Navigate to="/manutencao" replace /> : <CadastroPage />
        } />
        <Route path="/reset-senha" element={<ResetSenhaPage />} />
        <Route path="/manutencao" element={
          <ProtectedRoute><Layout><ManutencaoPage /></Layout></ProtectedRoute>
        } />
        <Route path="/manutencao/form" element={
          <ProtectedRoute><Layout><FormPage /></Layout></ProtectedRoute>
        } />
        <Route path="/meus-chamados" element={
          <ProtectedRoute><Layout><MeusChamadosPage /></Layout></ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute><Layout><UsuariosPage /></Layout></ProtectedRoute>
        } />
        <Route path="/checklist" element={
          <ProtectedRoute><Layout><ChecklistPage /></Layout></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
        } />
        <Route path="/qrcodes" element={
          <ProtectedRoute><Layout><QRCodesPage /></Layout></ProtectedRoute>
        } />
        <Route path="/documentos" element={
          <ProtectedRoute><Layout><DocumentosPage /></Layout></ProtectedRoute>
        } />
        <Route path="/documento/:id" element={<DocDownloadWrapper />} />
        <Route path="/checklist-preencher/:id" element={<ChecklistFillWrapper />} />
        <Route path="/contrato" element={<ContratoPage />} />
        <Route path="/proposta" element={<PropostaPage />} />
        <Route path="/os-assistencia-tecnica" element={<OSAssistenciaTecnicaPage />} />
        <Route path="/os-publica/:modelo" element={<OSPublicaPage />} />
        <Route path="/chamado/:protocolo" element={<ChamadoPublicoPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
