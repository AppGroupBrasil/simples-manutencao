import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { apiLogin, apiRegister, apiCreateUser, apiDeleteUser, clearToken, getToken, syncUpload, syncDownload, startAutoSync, stopAutoSync } from '../utils/api';

export type Role = 'master' | 'administrador' | 'supervisor' | 'funcionario';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  email?: string;
  role: Role;
  cargo?: string;
  adminId?: string;
  supervisorId?: string;
  administradorId?: string;
  bloqueado?: boolean;
  plano?: 'individual' | 'empresa';
  cadastradoEm?: number;
}

export interface UsuarioComSenha extends Usuario {
  senha: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  login: (loginStr: string, senha: string) => Promise<void>;
  logout: () => void;
  registrar: (dados: { nome: string; email: string; senha: string }) => Promise<void>;
  listarFuncionarios: () => Usuario[];
  criarFuncionario: (dados: { nome: string; cargo: string; senha: string; adminId?: string }) => { login: string };
  excluirFuncionario: (id: string) => void;
  listarAdmins: () => Usuario[];
  bloquearAdmin: (id: string) => void;
  desbloquearAdmin: (id: string) => void;
  excluirAdmin: (id: string) => void;
  editarAdmin: (id: string, dados: Partial<Pick<Usuario, 'nome' | 'email' | 'plano'>>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const USUARIOS_KEY = 'sm_usuarios_v2';
const SESSION_KEY  = 'sm_session_v2';

// Gera login a partir do nome (ex: "João Silva" → "joaosilva")
export function gerarLogin(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function getUsuarios(): UsuarioComSenha[] {
  try {
    const v = localStorage.getItem(USUARIOS_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

function salvarUsuarios(lista: UsuarioComSenha[]) {
  localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) {
        setUsuario(JSON.parse(s));
        // If we have a token, start auto-sync and download latest data
        if (getToken()) {
          startAutoSync();
          syncDownload().catch(() => {});
        }
      }
    } catch {}
    setCarregando(false);
  }, []);

  const login = async (loginStr: string, senha: string) => {
    const data = await apiLogin(loginStr, senha);
    if (!data?.usuario) throw new Error('Resposta inválida do servidor');
    setUsuario(data.usuario);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));
    startAutoSync();
    syncDownload().catch(() => {});
  };

  const logout = () => {
    // Upload latest data before logout
    syncUpload().catch(() => {});
    stopAutoSync();
    clearToken();
    setUsuario(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const registrar = async (dados: { nome: string; email: string; senha: string }) => {
    const data = await apiRegister(dados.nome, dados.email, dados.senha);
    if (!data?.usuario) throw new Error('Resposta inválida do servidor');
    setUsuario(data.usuario);
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));
    startAutoSync();
  };

  const listarFuncionarios = (): Usuario[] => {
    return getUsuarios()
      .filter(u => u.role === 'funcionario')
      .map(({ senha: _, ...u }) => u);
  };

  const criarFuncionario = (dados: { nome: string; cargo: string; senha: string; adminId?: string }) => {
    const usuarios = getUsuarios();
    const loginGerado = gerarLogin(dados.nome);
    // Cache local SEM a senha (senha real fica no servidor com bcrypt)
    const novoUsuario: UsuarioComSenha = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      nome: dados.nome,
      login: loginGerado,
      role: 'funcionario',
      cargo: dados.cargo,
      senha: '',
      adminId: dados.adminId || usuario?.adminId,
      administradorId: dados.adminId || usuario?.administradorId,
    };
    salvarUsuarios([...usuarios, novoUsuario]);

    apiCreateUser({ nome: dados.nome, cargo: dados.cargo, senha: dados.senha, role: 'funcionario' }).catch(() => {});

    return { login: loginGerado };
  };

  const excluirFuncionario = (id: string) => {
    const usuarios = getUsuarios().filter(u => u.id !== id);
    salvarUsuarios(usuarios);
    apiDeleteUser(id).catch(() => {});
  };

  const listarAdmins = (): Usuario[] => {
    return getUsuarios()
      .filter(u => u.role === 'administrador')
      .map(({ senha: _, ...u }) => u);
  };

  const bloquearAdmin = (id: string) => {
    const usuarios = getUsuarios().map(u => u.id === id ? { ...u, bloqueado: true } : u);
    salvarUsuarios(usuarios);
  };

  const desbloquearAdmin = (id: string) => {
    const usuarios = getUsuarios().map(u => u.id === id ? { ...u, bloqueado: false } : u);
    salvarUsuarios(usuarios);
  };

  const excluirAdmin = (id: string) => {
    const usuarios = getUsuarios().filter(u => u.id !== id && u.adminId !== id);
    salvarUsuarios(usuarios);
    apiDeleteUser(id).catch(() => {});
  };

  const editarAdmin = (id: string, dados: Partial<Pick<Usuario, 'nome' | 'email' | 'plano'>>) => {
    const usuarios = getUsuarios().map(u => u.id === id ? { ...u, ...dados } : u);
    salvarUsuarios(usuarios);
  };

  const value = useMemo(
    () => ({ usuario, carregando, login, logout, registrar, listarFuncionarios, criarFuncionario, excluirFuncionario, listarAdmins, bloquearAdmin, desbloquearAdmin, excluirAdmin, editarAdmin }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario, carregando]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ROLE_HIERARCHY: Record<Role, number> = {
  master: 4,
  administrador: 3,
  supervisor: 2,
  funcionario: 1,
};
