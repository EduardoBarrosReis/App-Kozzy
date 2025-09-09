import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

// Interface para definir os tipos de usuário
interface Usuario {
  email: string;
  password: string;
  perfil: 'supervisor' | 'atendente';
  nome: string;
}

interface UsuarioLogado {
  email: string;
  nome: string;
  perfil: 'supervisor' | 'atendente';
  loginTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  // Base de dados simulada de usuários com diferentes perfis
  private usuarios: Usuario[] = [
    {
      email: 'supervisor',
      password: '123',
      perfil: 'supervisor',
      nome: 'Admin Supervisor'
    },
    {
      email: 'teste',
      password: '123',
      perfil: 'atendente',
      nome: 'Usuário Teste'
    },
    {
      email: 'admin@kozzy.com',
      password: 'admin123',
      perfil: 'supervisor',
      nome: 'Administrador Kozzy'
    },
    {
      email: 'atendente@kozzy.com',
      password: 'atendente123',
      perfil: 'atendente',
      nome: 'Atendente Kozzy'
    }
  ];

  constructor(private router: Router) {
    // Verificar se há usuário logado ao inicializar o serviço
    this.verificarUsuarioLogado();
  }

  // Método de login
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

      // Salvar no storage apropriado
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(usuarioLogado));

      // Atualizar o BehaviorSubject
      this.usuarioLogadoSubject.next(usuarioLogado);

      // Redirecionar baseado no perfil
      this.redirecionarPorPerfil(usuarioEncontrado.perfil);

      return true;
    }

    return false;
  }

  // Método de logout
  logout(): void {
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('usuario');
    this.usuarioLogadoSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Verificar se usuário está logado
  isLogado(): boolean {
    return this.usuarioLogadoSubject.value !== null;
  }

  // Obter usuário logado
  getUsuarioLogado(): UsuarioLogado | null {
    return this.usuarioLogadoSubject.value;
  }

  // Verificar se usuário é supervisor
  isSupervisor(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.perfil === 'supervisor' || false;
  }

  // Verificar se usuário é atendente
  isAtendente(): boolean {
    const usuario = this.getUsuarioLogado();
    return usuario?.perfil === 'atendente' || false;
  }

  // Redirecionar baseado no perfil
  private redirecionarPorPerfil(perfil: 'supervisor' | 'atendente'): void {
    if (perfil === 'supervisor') {
      this.router.navigate(['/supervisor']);
    } else {
      this.router.navigate(['/central']);
    }
  }

  // Verificar usuário logado no storage
  private verificarUsuarioLogado(): void {
    const usuarioLocal = localStorage.getItem('usuario');
    const usuarioSession = sessionStorage.getItem('usuario');

    if (usuarioLocal) {
      this.usuarioLogadoSubject.next(JSON.parse(usuarioLocal));
    } else if (usuarioSession) {
      this.usuarioLogadoSubject.next(JSON.parse(usuarioSession));
    }
  }

  // Método para validar acesso a rotas protegidas
  canAccessSupervisorRoute(): boolean {
    return this.isLogado() && this.isSupervisor();
  }

  // Método para validar acesso a rotas de atendente
  canAccessAtendenteRoute(): boolean {
    return this.isLogado() && (this.isSupervisor() || this.isAtendente());
  }
}

