// src/app/auth.service.ts (CÓDIGO COMPLETO E ATUALIZADO)

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

// Interface para definir os tipos de usuário na "base de dados"
interface Usuario {
  email: string;
  password: string;
  perfil: 'supervisor' | 'atendente';
  nome: string;
}

export interface UsuarioLogado {
  email: string;
  nome: string;
  perfil: 'supervisor' | 'atendente';
  loginTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'kozzy_usuarios';
  private usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  private usuarios: Usuario[] = [];

  constructor(private router: Router) {
    this.carregarUsuarios();
    this.verificarUsuarioLogado();
  }

  // ADICIONE ESTE NOVO MÉTODO
  getTodosUsuarios(): Usuario[] {
    // Retorna uma cópia da lista de usuários
    return [...this.usuarios];
  }

  // --- O RESTO DO SEU SERVIÇO CONTINUA IGUAL ---
  private carregarUsuarios(): void {
    const usuariosSalvos = localStorage.getItem(this.USERS_STORAGE_KEY);
    if (usuariosSalvos) { this.usuarios = JSON.parse(usuariosSalvos); } 
    else {
      this.usuarios = [
        { email: 'supervisor', password: '123', perfil: 'supervisor', nome: 'Admin Supervisor' },
        { email: 'teste', password: '123', perfil: 'atendente', nome: 'Usuário Teste' },
        { email: 'admin@kozzy.com', password: 'admin123', perfil: 'supervisor', nome: 'Administrador Kozzy' },
        { email: 'atendente@kozzy.com', password: 'atendente123', perfil: 'atendente', nome: 'Atendente Kozzy' }
      ];
      this.salvarUsuarios();
    }
  }

  // Salva a lista de usuários no localStorage
  private salvarUsuarios(): void {
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(this.usuarios));
  }

  // NOVO MÉTODO: Criar um novo usuário
  criarUsuario(novoUsuario: Omit<Usuario, 'email'> & { email: string }): { sucesso: boolean, mensagem: string } {
    const usuarioExistente = this.usuarios.find(u => u.email.toLowerCase() === novoUsuario.email.toLowerCase());
    if (usuarioExistente) {
      return { sucesso: false, mensagem: 'Este e-mail ou nome de usuário já está em uso.' };
    }

    this.usuarios.push(novoUsuario);
    this.salvarUsuarios(); // Persiste a nova lista de usuários
    return { sucesso: true, mensagem: 'Usuário criado com sucesso!' };
  }
  
  // NOVO MÉTODO: Recuperar senha de um usuário (simulação)
  recuperarSenha(email: string): string | null {
    const usuario = this.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    return usuario ? usuario.password : null;
  }

  // Método de login (sem alterações na lógica interna)
  login(email: string, password: string, rememberMe: boolean = false): boolean {
    const usuarioEncontrado = this.usuarios.find(
      user => user.email === email && user.password === password
    );

    if (usuarioEncontrado) {
      const usuarioLogado: UsuarioLogado = {
        email: usuarioEncontrado.email,
        nome: usuarioEncontrado.nome,
        perfil: usuarioEncontrado.perfil,
        loginTime: new Date().toISOString()
      };
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(usuarioLogado));
      this.usuarioLogadoSubject.next(usuarioLogado);
      this.redirecionarPorPerfil(usuarioEncontrado.perfil);
      return true;
    }
    return false;
  }

  // Método de logout (sem alterações)
  logout(): void {
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('usuario');
    this.usuarioLogadoSubject.next(null);
    this.router.navigate(['/login']);
  }
  
  // Demais métodos (isLogado, getUsuarioLogado, etc.) permanecem os mesmos
  isLogado(): boolean { return this.usuarioLogadoSubject.value !== null; }
  getUsuarioLogado(): UsuarioLogado | null { return this.usuarioLogadoSubject.value; }
  isSupervisor(): boolean { return this.getUsuarioLogado()?.perfil === 'supervisor' || false; }
  isAtendente(): boolean { return this.getUsuarioLogado()?.perfil === 'atendente' || false; }
  private redirecionarPorPerfil(perfil: 'supervisor' | 'atendente'): void { if (perfil === 'supervisor') { this.router.navigate(['/supervisor']); } else { this.router.navigate(['/central']); } }
  private verificarUsuarioLogado(): void { const uL = localStorage.getItem('usuario'); const uS = sessionStorage.getItem('usuario'); if (uL) { this.usuarioLogadoSubject.next(JSON.parse(uL)); } else if (uS) { this.usuarioLogadoSubject.next(JSON.parse(uS)); } }
  canAccessSupervisorRoute(): boolean { return this.isLogado() && this.isSupervisor(); }
  canAccessAtendenteRoute(): boolean { return this.isLogado() && (this.isSupervisor() || this.isAtendente()); }
}