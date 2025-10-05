// src/app/supervisor-dashboard/supervisor-dashboard.component.ts (CÓDIGO COMPLETO E ATUALIZADO)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ChamadosService, Chamado, RelatorioFilters } from '../chamados.service';
import { Subscription } from 'rxjs';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { CriarUsuarioModalComponent } from '../criar-usuario-modal/criar-usuario-modal.component'; // **NOVA IMPORTAÇÃO**

// --- INTERFACES ---
interface KPI { label: string; value: number; color: string; icon: string; }
interface FilterOptions { busca: string; status: string; prioridade: string; ordenacao: string; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }
interface Usuario { nome: string; email: string; }
interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    RelatorioFiltroModalComponent, RelatorioScreenComponent,
    CriarUsuarioModalComponent // **ADICIONADO AQUI**
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  // --- PROPRIEDADES DE CONTROLE DE MODAIS ---
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  showCriarUsuarioModal: boolean = false; // **NOVA PROPRIEDADE**
  
  relatorioChamados: Chamado[] = [];
  menuCollapsed: boolean = false;
  menuItems: MenuItem[] = [];
  usuarioLogado: Usuario | null = null;
  filtros: FilterOptions = { busca: '', status: 'todos', prioridade: 'todas', ordenacao: 'mais-recentes' };
  toast: ToastMessage = { message: '', type: 'info', visible: false };
  kpis: KPI[] = [ /* ... */ ];
  chamados: Chamado[] = [];
  private chamadosSubscription!: Subscription;

  constructor(private router: Router, private authService: AuthService, private chamadosService: ChamadosService) {}

  ngOnInit() {
    // ... lógica de autenticação ...
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    // --- ATUALIZAÇÃO DO MENU ---
    this.menuItems = [
      { label: 'Visão Geral', icon: '👑', route: '/supervisor', active: true },
      { label: 'Criar Usuário', icon: '👤', action: () => this.abrirModalCriarUsuario() }, // **NOVO ITEM**
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
    ];
    
    // ... resto do ngOnInit ...
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.chamadosSubscription = this.chamadosService.chamados$.subscribe(novosChamados => {
      this.chamados = novosChamados; this.calcularKPIs();
    });
  }

  ngOnDestroy() { if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); } window.removeEventListener('resize', this.checkScreenSize.bind(this)); }
  
  // --- NOVOS MÉTODOS PARA O MODAL DE USUÁRIO ---
  abrirModalCriarUsuario(): void { this.showCriarUsuarioModal = true; }
  fecharModalCriarUsuario(): void { this.showCriarUsuarioModal = false; }
  onUsuarioCriado(mensagem: string): void {
    this.showToast(mensagem, 'success');
    this.fecharModalCriarUsuario();
  }
  
  // --- Métodos de Relatório e demais métodos ...
  abrirModalRelatorios(): void { this.showRelatorioScreen = false; this.relatorioChamados = []; this.showRelatorioFiltrosModal = true; }
  fecharModalRelatorioFiltros(): void { this.showRelatorioFiltrosModal = false; }
  onGerarRelatorio(filtros: RelatorioFilters): void { this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros); this.showRelatorioFiltrosModal = false; setTimeout(() => { this.showRelatorioScreen = true; }, 100); }
  fecharRelatorioScreen(): void { this.showRelatorioScreen = false; this.relatorioChamados = []; }
  checkScreenSize() { this.menuCollapsed = window.innerWidth < 1024; }
  logout(): void { if (confirm('Tem certeza?')) { this.authService.logout(); } }
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  
  // ... resto dos seus métodos (calcularKPIs, filtros, etc.)
  calcularKPIs() { /* ... */ }
  setFilter(key: any, value: any) { /* ... */ }
  getChamadosFiltrados(): Chamado[] { /* ... */ return this.chamados; }
  getStatusLabel(s:string){return{'aberto':'Aberto','em-andamento':'Em Andamento','fechado':'Concluído'}[s]||''}
  getPrioridadeLabel(p:string){return{'baixa':'Baixa','media':'Média','alta':'Alta','urgente':'Urgente'}[p]||''}
  getPrioridadeClass(p:string){return{'alta':'prioridade-alta','urgente':'prioridade-alta','media':'prioridade-media','baixa':'prioridade-baixa'}[p]||''}
  getStatusClass(s:string){return`status-${s.replace('-','')}`}
  formatarData(d:any){return new Date(d).toLocaleDateString('pt-BR')}
}