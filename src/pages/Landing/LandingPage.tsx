import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, ClipboardList, Inbox, Users, CheckCircle2, Clock,
  BarChart3, Share2, FileDown, Shield, Zap, Smartphone,
  ChevronRight, Star, ArrowRight, Menu, X,
  PlayCircle, Bell, Download
} from 'lucide-react';
import styles from './LandingPage.module.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('Para instalar: abra o menu do navegador (⋮) e toque em "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Simples Manutenção',
      text: 'Sistema de manutenção inteligente — gerencie chamados, checklists e equipe em um só lugar.',
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      alert('Link copiado!');
    }
  };

  return (
    <div className={styles.wrapper}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <img src="/logos/simples-manutencao.png?v=2" alt="Logo" className={styles.logoIcon} style={{ height: 28, objectFit: 'contain' }} />
            <span className={styles.logoText}>Simples <strong>Manutenção</strong></span>
          </div>

          <nav className={styles.headerNav}>
            <a href="#funcionalidades" className={styles.navLink}>Funcionalidades</a>
            <a href="#como-funciona" className={styles.navLink}>Como funciona</a>
            <a href="#para-quem" className={styles.navLink}>Para quem</a>
            <span className={styles.navLink} style={{ cursor: 'pointer' }} onClick={() => navigate('/tutorial')}>Tutorial</span>
          </nav>

          <div className={styles.headerActions}>
            <button className={styles.btnSecundario} onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button className={styles.btnPrimario} onClick={() => navigate('/cadastro')}>
              Começar grátis <ChevronRight size={16} />
            </button>
          </div>

          <button className={styles.menuToggle} onClick={() => setMenuAberto(!menuAberto)}>
            {menuAberto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuAberto && (
          <div className={styles.mobileMenu}>
            <a href="#funcionalidades" className={styles.mobileLink} onClick={() => setMenuAberto(false)}>Funcionalidades</a>
            <a href="#como-funciona" className={styles.mobileLink} onClick={() => setMenuAberto(false)}>Como funciona</a>
            <span className={styles.mobileLink} style={{ cursor: 'pointer' }} onClick={() => { setMenuAberto(false); navigate('/tutorial'); }}>Tutorial</span>
            <a href="#para-quem" className={styles.mobileLink} onClick={() => setMenuAberto(false)}>Para quem</a>
            <button className={styles.btnPrimario} style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/cadastro')}>
              Começar grátis
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroDecor1} />
        <div className={styles.heroDecor2} />
        <div className={styles.heroDecor3} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Zap size={14} /> Sistema de Manutenção Inteligente
          </div>

          <h1 className={styles.heroTitle}>
            Gerencie sua equipe de manutenção com{' '}
            <span className={styles.heroDestaque}>simplicidade e eficiência</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Crie chamados, atribua tarefas, acompanhe checklists e monitore o desempenho da sua equipe — tudo em um só lugar, acessível de qualquer dispositivo.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimario} onClick={() => navigate('/cadastro')}>
              Começar agora <ArrowRight size={18} />
            </button>
            <button className={styles.ctaSecundario} onClick={() => navigate('/login')}>
              Já tenho conta
            </button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>100%</span>
              <span className={styles.statLabel}>Online</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>Papel</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>∞</span>
              <span className={styles.statLabel}>Chamados</span>
            </div>
          </div>

          <div className={styles.heroAppButtons}>
            <button className={styles.installBtn} onClick={handleInstall}>
              <Download size={18} /> Instalar App
            </button>
            <button className={styles.shareBtn} onClick={handleShare}>
              <Share2 size={18} /> Compartilhar
            </button>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mockup}>
            <div className={styles.mockupHeader}>
              <span className={styles.mockupDot} style={{ background: '#ff5f57' }} />
              <span className={styles.mockupDot} style={{ background: '#ffbd2e' }} />
              <span className={styles.mockupDot} style={{ background: '#28ca41' }} />
              <span className={styles.mockupTitle}><img src="/logos/simples-manutencao.png?v=2" alt="" style={{ height: 14, objectFit: 'contain', verticalAlign: 'middle', marginRight: 4 }} /> S. Manutenção</span>
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupCard} style={{ borderLeft: '4px solid #22c55e' }}>
                <div className={styles.mockupCardTop}>
                  <span className={styles.mockupTag} style={{ background: '#dcfce7', color: '#15803d' }}>✓ Concluído</span>
                  <span className={styles.mockupTime}><Clock size={11} /> 1h 20m</span>
                </div>
                <p className={styles.mockupCardTitle}>Troca de lâmpadas — Bloco A</p>
                <p className={styles.mockupCardSub}>João Silva</p>
              </div>
              <div className={styles.mockupCard} style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className={styles.mockupCardTop}>
                  <span className={styles.mockupTag} style={{ background: '#fef3c7', color: '#92400e' }}>⏳ Em andamento</span>
                  <span className={styles.mockupTime}><Clock size={11} /> 0h 45m</span>
                </div>
                <p className={styles.mockupCardTitle}>Reparo hidráulico — Sala 3</p>
                <p className={styles.mockupCardSub}>Carlos Pereira</p>
              </div>
              <div className={styles.mockupCard} style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className={styles.mockupCardTop}>
                  <span className={styles.mockupTag} style={{ background: '#dbeafe', color: '#1d4ed8' }}>📋 Checklist</span>
                  <span className={styles.mockupTime}>8/10 itens</span>
                </div>
                <p className={styles.mockupCardTitle}>Inspeção mensal — Elevadores</p>
                <p className={styles.mockupCardSub}>Ana Costa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Funcionalidades</div>
          <h2 className={styles.sectionTitle}>Tudo que você precisa para gerenciar manutenção</h2>
          <p className={styles.sectionSubtitle}>Ferramentas poderosas pensadas para gestores e equipes de campo</p>

          <div className={styles.featGrid}>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #FFD600, #FF8F00)' }}>
                <Wrench size={26} color="#0D0D0D" />
              </div>
              <h3 className={styles.featTitle}>Chamados de Manutenção</h3>
              <p className={styles.featDesc}>Crie funções personalizadas de manutenção com ícones e cores exclusivas. Atribua chamados à equipe com um clique, acompanhe o status em tempo real e monitore o tempo gasto.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> Funções totalmente personalizáveis</li>
                <li><CheckCircle2 size={14} /> Timer automático por chamado</li>
                <li><CheckCircle2 size={14} /> Status: Aberto, Em andamento, Concluído</li>
                <li><CheckCircle2 size={14} /> Compartilhamento via WhatsApp</li>
              </ul>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                <ClipboardList size={26} color="#fff" />
              </div>
              <h3 className={styles.featTitle}>Checklists Inteligentes</h3>
              <p className={styles.featDesc}>Crie checklists livres ou administradas. Atribua inspeções a funcionários específicos, acompanhe o progresso com barras visuais e exporte relatórios em PDF.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> Checklist livre ou por administrador</li>
                <li><CheckCircle2 size={14} /> Reporte problemas com foto e áudio</li>
                <li><CheckCircle2 size={14} /> Progresso visual em tempo real</li>
                <li><CheckCircle2 size={14} /> Exportação em PDF</li>
              </ul>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
                <Inbox size={26} color="#fff" />
              </div>
              <h3 className={styles.featTitle}>Meus Chamados</h3>
              <p className={styles.featDesc}>Cada funcionário visualiza apenas seus chamados atribuídos. Filtre por status, veja o histórico completo e acompanhe o desempenho ao longo do tempo.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> Visão individual por funcionário</li>
                <li><CheckCircle2 size={14} /> Filtros por status e data</li>
                <li><CheckCircle2 size={14} /> Histórico completo de atividades</li>
                <li><CheckCircle2 size={14} /> Tempo total registrado</li>
              </ul>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                <BarChart3 size={26} color="#fff" />
              </div>
              <h3 className={styles.featTitle}>Relatórios e Análises</h3>
              <p className={styles.featDesc}>Dashboards com gráficos de barras e pizza para visualizar o desempenho da equipe, taxa de conclusão de checklists e histórico de manutenções realizadas.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> Gráficos de desempenho</li>
                <li><CheckCircle2 size={14} /> Taxa de conclusão por período</li>
                <li><CheckCircle2 size={14} /> Exportação de dados</li>
                <li><CheckCircle2 size={14} /> Histórico detalhado</li>
              </ul>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
                <Users size={26} color="#fff" />
              </div>
              <h3 className={styles.featTitle}>Gestão de Equipe</h3>
              <p className={styles.featDesc}>Cadastre funcionários com diferentes níveis de acesso. Administradores gerenciam tudo, supervisores monitoram, funcionários executam.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> 3 níveis de acesso</li>
                <li><CheckCircle2 size={14} /> Cadastro e gerenciamento simples</li>
                <li><CheckCircle2 size={14} /> Controle por perfil de acesso</li>
                <li><CheckCircle2 size={14} /> Visibilidade por hierarquia</li>
              </ul>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}>
                <Smartphone size={26} color="#fff" />
              </div>
              <h3 className={styles.featTitle}>Acesso Mobile</h3>
              <p className={styles.featDesc}>Sistema 100% responsivo, funciona perfeitamente no celular pelo navegador ou como aplicativo nativo Android e iOS com Capacitor.</p>
              <ul className={styles.featList}>
                <li><CheckCircle2 size={14} /> Interface adaptada para mobile</li>
                <li><CheckCircle2 size={14} /> App Android e iOS disponível</li>
                <li><CheckCircle2 size={14} /> Navegação por ícones na base</li>
                <li><CheckCircle2 size={14} /> Câmera integrada para fotos</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Como funciona</div>
          <h2 className={styles.sectionTitle}>Do chamado à conclusão em minutos</h2>
          <p className={styles.sectionSubtitle}>Um fluxo simples e intuitivo para toda a sua equipe</p>

          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Configure as funções</h3>
                <p className={styles.stepDesc}>O administrador cria funções de manutenção personalizadas com nome, ícone e cor para cada tipo de serviço da sua operação.</p>
              </div>
            </div>
            <div className={styles.stepArrow}><ChevronRight size={24} /></div>

            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Abra um chamado</h3>
                <p className={styles.stepDesc}>Selecione a função desejada, adicione observações e atribua o chamado ao funcionário responsável com apenas alguns toques.</p>
              </div>
            </div>
            <div className={styles.stepArrow}><ChevronRight size={24} /></div>

            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Acompanhe em tempo real</h3>
                <p className={styles.stepDesc}>O funcionário atualiza o status do chamado. O timer registra automaticamente o tempo. Supervisores monitoram tudo em tempo real.</p>
              </div>
            </div>
            <div className={styles.stepArrow}><ChevronRight size={24} /></div>

            <div className={styles.step}>
              <div className={styles.stepNum}>04</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Conclua e compartilhe</h3>
                <p className={styles.stepDesc}>Ao finalizar, o registro fica no histórico. Compartilhe o resumo via WhatsApp ou exporte relatórios PDF com todos os detalhes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXTRAS ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.extrasGrid}>
            <div className={styles.extraCard}>
              <Share2 size={32} className={styles.extraIcon} />
              <h3 className={styles.extraTitle}>Compartilhe via WhatsApp</h3>
              <p className={styles.extraDesc}>Envie resumos de chamados diretamente pelo WhatsApp com um toque. Mantenha clientes e gestores sempre informados.</p>
            </div>
            <div className={styles.extraCard}>
              <FileDown size={32} className={styles.extraIcon} />
              <h3 className={styles.extraTitle}>Exportação em PDF</h3>
              <p className={styles.extraDesc}>Gere relatórios profissionais de checklists e chamados em PDF com um clique, prontos para arquivamento ou apresentação.</p>
            </div>
            <div className={styles.extraCard}>
              <Clock size={32} className={styles.extraIcon} />
              <h3 className={styles.extraTitle}>Timer Automático</h3>
              <p className={styles.extraDesc}>Cada chamado registra automaticamente o tempo de início e fim, gerando dados precisos de produtividade da equipe.</p>
            </div>
            <div className={styles.extraCard}>
              <Shield size={32} className={styles.extraIcon} />
              <h3 className={styles.extraTitle}>Acesso por Perfil</h3>
              <p className={styles.extraDesc}>Controle granular de acesso. Cada perfil vê e faz apenas o que é permitido para seu nível hierárquico.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM ── */}
      <section id="para-quem" className={styles.sectionGradient}>
        <div className={styles.heroDecor1} style={{ opacity: 0.15 }} />
        <div className={styles.heroDecor2} style={{ opacity: 0.1 }} />
        <div className={styles.sectionInner} style={{ position: 'relative', zIndex: 1 }}>
          <div className={styles.sectionLabel} style={{ background: 'rgba(255,255,255,0.9)', color: '#0D0D0D' }}>Para quem</div>
          <h2 className={styles.sectionTitle} style={{ color: '#0D0D0D', fontWeight: 900 }}>Ideal para equipes de manutenção</h2>
          <p className={styles.sectionSubtitle} style={{ color: 'rgba(13,13,13,0.75)' }}>Do prédio residencial à indústria — onde há manutenção, o Simples resolve</p>

          <div className={styles.perfilGrid}>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏢</div>
              <h3 className={styles.perfilTitle}>Condomínios</h3>
              <p className={styles.perfilDesc}>Controle manutenções de elevadores, bombas, jardins, portões e áreas comuns com equipe dedicada.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏭</div>
              <h3 className={styles.perfilTitle}>Indústrias</h3>
              <p className={styles.perfilDesc}>Gerencie ordens de serviço, checklists preventivos e equipes de manutenção mecânica e elétrica.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏥</div>
              <h3 className={styles.perfilTitle}>Hospitais e Clínicas</h3>
              <p className={styles.perfilDesc}>Mantenha registros rigorosos de manutenção de equipamentos críticos com rastreabilidade completa.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏫</div>
              <h3 className={styles.perfilTitle}>Escolas e Faculdades</h3>
              <p className={styles.perfilDesc}>Organize as demandas de infraestrutura e manutenção predial com eficiência e sem papelada.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏨</div>
              <h3 className={styles.perfilTitle}>Hotéis e Resorts</h3>
              <p className={styles.perfilDesc}>Atenda chamados de manutenção dos hóspedes com agilidade e mantenha o histórico de cada quarto.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🏗️</div>
              <h3 className={styles.perfilTitle}>Construtoras</h3>
              <p className={styles.perfilDesc}>Gerencie equipes de campo em obras e checklists de inspeção por etapa construtiva.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🔧</div>
              <h3 className={styles.perfilTitle}>Prestadores de Serviço</h3>
              <p className={styles.perfilDesc}>Autônomos e empresas de manutenção que precisam organizar chamados, clientes e histórico de serviços.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🛒</div>
              <h3 className={styles.perfilTitle}>Comércio</h3>
              <p className={styles.perfilDesc}>Supermercados, lojas e centros comerciais que precisam controlar manutenção de equipamentos e instalações.</p>
            </div>
            <div className={styles.perfilCard}>
              <div className={styles.perfilEmoji}>🔩</div>
              <h3 className={styles.perfilTitle}>Oficinas</h3>
              <p className={styles.perfilDesc}>Organize ordens de serviço, equipe técnica e histórico de cada equipamento ou veículo atendido.</p>
            </div>
            <div className={`${styles.perfilCard} ${styles.perfilCardDestaque}`}>
              <div className={styles.perfilEmoji}>🌐</div>
              <h3 className={styles.perfilTitle}>E muito mais...</h3>
              <p className={styles.perfilDesc}>Atendemos a todos os setores que precisam de manutenção — das mais simples às mais complexas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFIS DE ACESSO ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Perfis de acesso</div>
          <h2 className={styles.sectionTitle}>Hierarquia clara para cada função</h2>
          <p className={styles.sectionSubtitle}>3 perfis diferentes com permissões adequadas para cada papel na equipe</p>

          <div className={styles.rolesGrid}>
<div className={styles.roleCard}>
              <div className={styles.roleHeader} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                <span className={styles.roleEmoji}>⚙️</span>
                <span className={styles.roleName}>Administrador</span>
              </div>
              <ul className={styles.rolePerms}>
                <li><CheckCircle2 size={13} /> Gerencia funcionários</li>
                <li><CheckCircle2 size={13} /> Cria e atribui chamados</li>
                <li><CheckCircle2 size={13} /> Cria checklists administradas</li>
                <li><CheckCircle2 size={13} /> Visualiza relatórios da equipe</li>
              </ul>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleHeader} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                <span className={styles.roleEmoji}>👁️</span>
                <span className={styles.roleName}>Supervisor</span>
              </div>
              <ul className={styles.rolePerms}>
                <li><CheckCircle2 size={13} /> Monitora chamados da equipe</li>
                <li><CheckCircle2 size={13} /> Abre chamados e checklists</li>
                <li><CheckCircle2 size={13} /> Acompanha progresso em tempo real</li>
                <li><CheckCircle2 size={13} /> Acesso ao histórico</li>
              </ul>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleHeader} style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
                <span className={styles.roleEmoji}>🔧</span>
                <span className={styles.roleName}>Funcionário</span>
              </div>
              <ul className={styles.rolePerms}>
                <li><CheckCircle2 size={13} /> Visualiza seus chamados</li>
                <li><CheckCircle2 size={13} /> Atualiza status das tarefas</li>
                <li><CheckCircle2 size={13} /> Executa checklists atribuídos</li>
                <li><CheckCircle2 size={13} /> Registra problemas com foto</li>
              </ul>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleHeader} style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}>
                <span className={styles.roleEmoji}>📷</span>
                <span className={styles.roleName}>QR Code</span>
              </div>
              <ul className={styles.rolePerms}>
                <li><CheckCircle2 size={13} /> Abertura de chamado via QR Code</li>
                <li><CheckCircle2 size={13} /> Login rápido por QR Code</li>
                <li><CheckCircle2 size={13} /> Acesso a checklist por QR Code</li>
                <li><CheckCircle2 size={13} /> Identificação de equipamento</li>
                <li><CheckCircle2 size={13} /> Compartilhamento de chamado</li>
                <li><CheckCircle2 size={13} /> Link direto para ordem de serviço</li>
              </ul>
            </div>
          </div>

          <div className={styles.qrDestaque}>
            <span className={styles.qrDestaqueEmoji}>📲</span>
            <p className={styles.qrDestaqueTexto}>
              Seus funcionários <strong>não precisam baixar nenhum aplicativo</strong> — realize todas as manutenções através de{' '}
              <strong>link</strong> ou <strong>QR Code</strong>.
            </p>
          </div>

        </div>
      </section>

      {/* ── PREÇOS E PLANOS ── */}
      <section className={styles.precosSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Preços e Planos</div>
          <h2 className={styles.sectionTitle}>Simples, transparente, sem surpresas</h2>
          <p className={styles.sectionSubtitle}>Escolha o plano ideal para sua equipe. Cancele quando quiser, sem multas.</p>

          <div className={styles.precosGrid}>

            {/* Individual */}
            <div className={styles.precosCard}>
              <div className={styles.precosIconWrap} style={{ background: 'linear-gradient(135deg, #FFD600, #FF8F00)' }}>
                <Users size={24} color="#0D0D0D" />
              </div>
              <h3 className={styles.precosCardNome}>Individual</h3>
              <p className={styles.precosCardDesc}>Ideal para uso pessoal ou autônomos.</p>
              <div className={styles.precosPreco}>
                <span className={styles.precosValor}>R$ 99</span>
                <span className={styles.precosPeriodo}>/mês</span>
              </div>
              <p className={styles.precosDetalhe}>Acesso completo para 1 usuário.</p>
              <ul className={styles.precosLista}>
                <li><CheckCircle2 size={14} /> 1 usuário incluído</li>
                <li><CheckCircle2 size={14} /> Chamados ilimitados</li>
                <li><CheckCircle2 size={14} /> Checklists e relatórios PDF</li>
                <li><CheckCircle2 size={14} /> Acesso mobile</li>
              </ul>
              <button className={styles.precosBtnSecundario} onClick={() => navigate('/cadastro')}>
                Começar agora <ArrowRight size={15} />
              </button>
            </div>

            {/* Empresa — destaque */}
            <div className={`${styles.precosCard} ${styles.precosCardDestaque}`}>
              <div className={styles.precosPopular}>⭐ Mais popular</div>
              <div className={styles.precosIconWrap} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}>
                <Users size={24} color="#fff" />
              </div>
              <h3 className={styles.precosCardNome}>Empresa</h3>
              <p className={styles.precosCardDesc}>Perfeito para pequenas e médias equipes.</p>
              <div className={styles.precosPreco}>
                <span className={styles.precosValor}>R$ 199</span>
                <span className={styles.precosPeriodo}>/mês</span>
              </div>
              <p className={styles.precosDetalhe}>Até 5 usuários incluídos.</p>
              <ul className={styles.precosLista}>
                <li><CheckCircle2 size={14} /> Até 5 usuários incluídos</li>
                <li><CheckCircle2 size={14} /> Chamados ilimitados</li>
                <li><CheckCircle2 size={14} /> Checklists e relatórios PDF</li>
                <li><CheckCircle2 size={14} /> Acesso mobile</li>
                <li><CheckCircle2 size={14} /> Painel de gestão completo</li>
                <li><CheckCircle2 size={14} /> Suporte prioritário</li>
              </ul>
              <button className={styles.precosBtnPrimario} onClick={() => navigate('/cadastro')}>
                Começar agora <ArrowRight size={15} />
              </button>
            </div>

            {/* Usuário Adicional */}
            <div className={styles.precosCard}>
              <div className={styles.precosIconWrap} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                <Zap size={24} color="#fff" />
              </div>
              <h3 className={styles.precosCardNome}>Usuário Adicional</h3>
              <p className={styles.precosCardDesc}>Para equipes acima de 5 usuários.</p>
              <div className={styles.precosPreco}>
                <span className={styles.precosValor}>R$ 25</span>
                <span className={styles.precosPeriodo}>/mês por usuário</span>
              </div>
              <p className={styles.precosDetalhe}>Cada usuário extra custa R$ 25/mês.</p>
              <ul className={styles.precosLista}>
                <li><CheckCircle2 size={14} /> Adicione quantos precisar</li>
                <li><CheckCircle2 size={14} /> Mesmo acesso do plano Empresa</li>
                <li><CheckCircle2 size={14} /> Ative e desative quando quiser</li>
              </ul>
              <button className={styles.precosBtnSecundario} onClick={() => navigate('/cadastro')}>
                Começar agora <ArrowRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONHEÇA O SIMPLES MANUTENÇÃO ── */}
      <section className={styles.conhecaSection}>
        <div className={styles.conhecaInner}>
          <div className={styles.conhecaBadge}><Zap size={13} /> Acesso rápido</div>
          <h2 className={styles.conhecaTitle}>Conheça o <span className={styles.conhecaDestaque}>Simples Manutenção</span></h2>
          <p className={styles.conhecaSubtitle}>Tudo que você precisa para começar a usar o sistema.</p>

          <div className={styles.conhecaGrid}>

            <a href="/contrato" className={styles.conhecaCard}>
              <div className={styles.conhecaIconWrap} style={{ background: 'linear-gradient(135deg, #FFD600, #FF8F00)' }}>
                <FileDown size={26} color="#0D0D0D" />
              </div>
              <h3 className={styles.conhecaCardTitle}>Conheça nosso contrato</h3>
              <p className={styles.conhecaCardDesc}>Veja como é simples contratar o nosso sistema de manutenção.</p>
              <span className={styles.conhecaCardLink}>Visualizar contrato <ArrowRight size={14} /></span>
            </a>

            <a href="/apresentacao.html" target="_blank" rel="noopener noreferrer" className={styles.conhecaCard}>
              <div className={styles.conhecaIconWrap} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                <PlayCircle size={26} color="#fff" />
              </div>
              <h3 className={styles.conhecaCardTitle}>Ver demonstração</h3>
              <p className={styles.conhecaCardDesc}>Explore o sistema completo com dados de exemplo antes de cadastrar.</p>
              <span className={styles.conhecaCardLink}>Ver a apresentação <ArrowRight size={14} /></span>
            </a>

            <a href="/proposta" className={styles.conhecaCard}>
              <div className={styles.conhecaIconWrap} style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
                <Bell size={26} color="#fff" />
              </div>
              <h3 className={styles.conhecaCardTitle}>Conheça nossa proposta comercial</h3>
              <p className={styles.conhecaCardDesc}>Veja os planos, valores e condições para contratar o Simples Manutenção.</p>
              <span className={styles.conhecaCardLink}>Ver proposta <ArrowRight size={14} /></span>
            </a>

          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaDecor1} />
        <div className={styles.ctaDecor2} />
        <div className={styles.ctaInner}>
          <div className={styles.ctaStars}>
            {[1,2,3,4,5].map((n) => <Star key={n} size={20} fill="#FFD600" color="#FFD600" />)}
          </div>
          <h2 className={styles.ctaTitle}>Pronto para simplificar sua manutenção?</h2>
          <p className={styles.ctaSubtitle}>Comece agora mesmo. Sem instalação, sem complicação — acesse direto pelo navegador ou baixe o app.</p>
          <div className={styles.ctaBtns}>
            <button className={styles.ctaBtnPrimario} onClick={() => navigate('/cadastro')}>
              Criar conta grátis <ArrowRight size={18} />
            </button>
            <button className={styles.ctaBtnSecundario} onClick={() => navigate('/login')}>
              Já tenho conta
            </button>
          </div>
        </div>
      </section>

      {/* ── ECOSSISTEMA ── */}
      <section className={styles.ecoSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Ecossistema</div>
          <h2 className={styles.sectionTitle}>Faça parte do APP GROUP</h2>
          <p className={styles.sectionSubtitle}>Um ecossistema completo de aplicativos para gestão condominial e predial</p>

          <div className={styles.ecoGrid}>
            {[
              { src: '/logos/simples-manutencao.png?v=2',       nome: 'Simples Manutenção',  url: 'https://simplesmanutencao.com.br'     },
              { src: '/logos/Logo App Condomínio.png',      nome: 'App Condomínio',      url: 'https://appcondominio.com.br'         },
              { src: '/logos/Logo App Síndico.png',         nome: 'App Síndico',         url: 'https://appsindico.com.br'            },
              { src: '/logos/App Portaria Logo.png',        nome: 'App Portaria',        url: 'https://appportaria.com.br'           },
              { src: '/logos/logo PortariaX.png',           nome: 'Portaria X',          url: 'https://portariax.com.br'             },
              { src: '/logos/Logo App Obras.png',           nome: 'App Obras',           url: 'https://appobras.com.br'              },
              { src: '/logos/Logo AppCorrespondencia.png',  nome: 'App Correspondência', url: 'https://appcorrespondencia.com.br'    },
              { src: '/logos/Logo Reserva.png',             nome: 'App Reserva',         url: null                                   },
              { src: '/logos/logo gestão.png',              nome: 'Gestão e Limpeza',    url: 'https://gestaoelimpeza.com.br'        },
              { src: '/logos/Logo Manutenção X.png',        nome: 'Manutenção X',        url: 'https://manutencaox.com.br'           },
            ].map(({ src, nome, url }) => (
              <a
                key={nome}
                href={url ?? '#'}
                target={url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={styles.ecoCard}
                style={{ textDecoration: 'none' }}
              >
                <img src={src} alt={nome} className={styles.ecoImg} />
                <span className={styles.ecoNome}>{nome}</span>
                {url && <span className={styles.ecoUrl}>{url.replace('https://', '')}</span>}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <img src="/logos/simples-manutencao.png?v=2" alt="Logo" style={{ height: 24, objectFit: 'contain' }} />
            <span>Simples <strong>Manutenção</strong></span>
          </div>
          <p className={styles.footerTagline}>Gestão de manutenção simples e eficiente para sua equipe.</p>
          <div className={styles.footerLinks}>
            <a href="#funcionalidades" className={styles.footerLink}>Funcionalidades</a>
            <span className={styles.footerSep}>·</span>
            <a href="#como-funciona" className={styles.footerLink}>Como funciona</a>
            <span className={styles.footerSep}>·</span>
            <a href="#para-quem" className={styles.footerLink}>Para quem</a>
            <span className={styles.footerSep}>·</span>
            <button className={styles.footerLink} onClick={() => navigate('/tutorial')}>Tutorial</button>
            <span className={styles.footerSep}>·</span>
            <button className={styles.footerLink} onClick={() => navigate('/login')}>Entrar</button>
          </div>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} Simples Manutenção. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
