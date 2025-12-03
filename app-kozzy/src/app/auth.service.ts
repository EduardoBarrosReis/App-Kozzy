import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // <--- Importar Inject e PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // <--- Importar isPlatformBrowser
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface UsuarioLogado {
  id?: string;
  email: string;
  nome: string;
  perfil: string; 
  token?: string;
  areas: string[]; // <--- NOVO CAMPO
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/usuarios';
  
  private usuarioLogadoSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  public usuarioLogado$ = this.usuarioLogadoSubject.asObservable();

  // Injetamos o PLATFORM_ID para saber se estamos no servidor ou navegador
  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
    this.verificarUsuarioLogado();
  }

  // --- LOGIN ---
  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    const payload = { email, senha: password };

    return this.http.post<any>(`${this.API_URL}/login`, payload, { withCredentials: true }).pipe(
      tap(response => {
        const usuarioBack = response.usuario;
        
        const usuarioFormatado: UsuarioLogado = {
          id: usuarioBack.id,
          email: usuarioBack.email,
          nome: usuarioBack.nomeCompleto,
          perfil: usuarioBack.perfilAcesso,
          token: response.token,
          areas: usuarioBack.areas || []
        };

        this.definirSessao(usuarioFormatado, rememberMe);
      })
    );
  }
deletarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { withCredentials: true });
  }
  // --- LOGOUT ---
  logout(): void {
    // Tenta chamar o back apenas se estiver no navegador (embora http funcione no server, o cookie é browser)
    if (isPlatformBrowser(this.platformId)) {
        this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).subscribe();
        this.limparSessaoLocal();
    }
    
    this.router.navigate(['/login']);
  }

  // --- GET USUÁRIOS ---
  getTodosUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true }).pipe(
      map(listaDoBackend => {
        return listaDoBackend.map(u => ({
          id: u._id,
          nome: u.nomeCompleto,
          email: u.email,
          perfil: u.perfilAcesso
        }));
      })
    );
  }

  // --- CRIAR USUÁRIO ---
  criarUsuario(dados: any): Observable<any> {
    const payload = {
      nomeCompleto: dados.nome,
      email: dados.email,
      senha: dados.password,
      perfilAcesso: dados.perfil
    };
    return this.http.post(`${this.API_URL}/register`, payload);
  }

  recuperarSenha(email: string): Observable<any> {
    return throwError(() => new Error('Funcionalidade de recuperação de senha ainda não implementada no servidor.'));
  }

  // =========================================================================
  // MÉTODOS AUXILIARES (PROTEGIDOS COM isPlatformBrowser)
  // =========================================================================

  private definirSessao(usuario: UsuarioLogado, rememberMe: boolean): void {
    this.usuarioLogadoSubject.next(usuario);
    
    // SÓ ACESSA LOCALSTORAGE SE FOR NAVEGADOR
    if (isPlatformBrowser(this.platformId)) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('usuario', JSON.stringify(usuario));
    }
  }

  private limparSessaoLocal(): void {
    this.usuarioLogadoSubject.next(null);

    // SÓ ACESSA LOCALSTORAGE SE FOR NAVEGADOR
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuario');
      sessionStorage.removeItem('usuario');
    }
  }

  private verificarUsuarioLogado(): void {
    // SÓ ACESSA LOCALSTORAGE SE FOR NAVEGADOR
    if (isPlatformBrowser(this.platformId)) {
      const uL = localStorage.getItem('usuario');
      const uS = sessionStorage.getItem('usuario');
      
      if (uL) {
        this.usuarioLogadoSubject.next(JSON.parse(uL));
      } else if (uS) {
        this.usuarioLogadoSubject.next(JSON.parse(uS));
      }
    }
  }

  isLogado(): boolean { 
    return this.usuarioLogadoSubject.value !== null; 
  }
  
  getUsuarioLogado(): UsuarioLogado | null { 
    return this.usuarioLogadoSubject.value; 
  }
  
  isSupervisor(): boolean { 
    return this.getUsuarioLogado()?.perfil === 'supervisor'; 
  }
  
  isAtendente(): boolean { 
    const p = this.getUsuarioLogado()?.perfil;
    // Retorna true se existe um perfil e NÃO é supervisor
    return !!p && p !== 'supervisor'; 
  }

  // Permite acesso se for supervisor OU qualquer outro perfil operacional
  canAccessAtendenteRoute(): boolean { 
    return this.isLogado(); // Qualquer logado pode acessar a rota básica
  }

  canAccessSupervisorRoute(): boolean { 
    return this.isLogado() && this.isSupervisor(); 
  }
  getAreaDoUsuario(): string {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return '';
    
    // Se o perfil for 'supervisor' ou 'atendente' (genérico), tenta pegar do array de areas
    if (usuario.perfil === 'supervisor' || usuario.perfil === 'atendente') {
        return usuario.areas && usuario.areas.length > 0 ? usuario.areas[0] : '';
    }

    // Se o perfil for 'logistica', 'financeiro', etc, O PRÓPRIO PERFIL É A ÁREA
    return usuario.perfil; 
  }
}