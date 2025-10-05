// src/app/supervisor-dashboard.component.ts (CÓDIGO COMPLETO E ATUALIZADO)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, UsuarioLogado } from '../auth.service';
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';

import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component'; // **IMPORTAÇÃO ADICIONADA**
import { CriarUsuarioModalComponent } from '../criar-usuario-modal/criar-usuario-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';


// --- INTERFACES ---
interface KPI { label: string; value: number; color: string; icon: string; }
interface FilterOptions { busca: string; status: string; prioridade: string; ordenacao: string; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }
interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    CreateTicketModalComponent, // **ADICIONADO AQUI**
    CriarUsuarioModalComponent,
    RelatorioFiltroModalComponent, 
    RelatorioScreenComponent,
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  // --- PROPRIEDADES DE CONTROLE DE MODAIS ---
  showTicketModal: boolean = false; // Para criar/editar chamado
  showCriarUsuarioModal: boolean = false;
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  
  chamadoSelecionado: Chamado | null = null; // Guarda o chamado para edição

  // --- PROPRIEDADES DE DADOS ---
  relatorioChamados: Chamado[] = [];
  menuCollapsed: boolean = false;
  menuItems: MenuItem[] = [];
  usuarioLogado: UsuarioLogado | null = null;
  filtros: FilterOptions = { busca: '', status: 'todos', prioridade: 'todas', ordenacao: 'mais-recentes' };
  toast: ToastMessage = { message: '', type: 'info', visible: false };
  kpis: KPI[] = [
    { label: 'Abertos', value: 0, color: 'red', icon: '🔴' },
    { label: 'Em Andamento', value: 0, color: 'yellow', icon: '🟡' },
    { label: 'Concluídos', value: 0, color: 'green', icon: '✅' },
    { label: 'Urgentes', value: 0, color: 'orange', icon: '⚠️' }
  ];
  chamados: Chamado[] = [];
  private chamadosSubscription!: Subscription;

  constructor(
    private router: Router, 
    public authService: AuthService, // Tornar público para o template
    private chamadosService: ChamadosService
  ) {}

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    this.menuItems = [
      { label: 'Visão Geral', icon: '👑', route: '/supervisor', active: true },
      { label: 'Criar Usuário', icon: '👤', action: () => this.abrirModalCriarUsuario() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
    ];
    
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    
    this.chamadosSubscription = this.chamadosService.chamados$.subscribe(novosChamados => {
      this.chamados = novosChamados; 
      this.calcularKPIs();
    });
  }

  ngOnDestroy() { 
    if (this.chamadosSubscription) { 
      this.chamadosSubscription.unsubscribe(); 
    } 
    window.removeEventListener('resize', this.checkScreenSize.bind(this)); 
  }
  
  // --- MÉTODOS PARA MODAL DE CRIAR/EDITAR CHAMADO ---
  abrirModalEdicao(chamado: Chamado): void {
    // Como supervisor, não há trava de segurança
    this.chamadoSelecionado = { ...chamado };
    this.showTicketModal = true;
  }

  fecharTicketModal(): void {
    this.showTicketModal = false;
    this.chamadoSelecionado = null;
  }

  onChamadoAtualizado(chamadoAtualizado: Chamado): void {
    this.chamadosService.atualizarChamado(chamadoAtualizado);
    this.fecharTicketModal();
    this.showToast('Chamado atualizado com sucesso!', 'success');
  }

  // A função de criar chamado também usará este modal
  abrirModalCriarChamado(): void {
    this.chamadoSelecionado = null;
    this.showTicketModal = true;
  }

  onChamadoCriado(novoChamado: NovoChamado): void {
    this.chamadosService.adicionarChamado(novoChamado);
    this.fecharTicketModal();
    this.showToast('Chamado criado com sucesso!', 'success');
  }

  // --- MÉTODOS PARA MODAL DE USUÁRIO ---
  abrirModalCriarUsuario(): void { this.showCriarUsuarioModal = true; }
  fecharModalCriarUsuario(): void { this.showCriarUsuarioModal = false; }
  onUsuarioCriado(mensagem: string): void {
    this.showToast(mensagem, 'success');
    this.fecharModalCriarUsuario();
  }
  
  // --- O RESTO DOS SEUS MÉTODOS (filtros, kpis, logout, etc.) ---
  abrirModalRelatorios(): void { this.showRelatorioScreen = false; this.relatorioChamados = []; this.showRelatorioFiltrosModal = true; }
  fecharModalRelatorioFiltros(): void { this.showRelatorioFiltrosModal = false; }
  onGerarRelatorio(filtros: RelatorioFilters): void { this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros); this.showRelatorioFiltrosModal = false; setTimeout(() => { this.showRelatorioScreen = true; }, 100); }
  fecharRelatorioScreen(): void { this.showRelatorioScreen = false; this.relatorioChamados = []; }
  checkScreenSize() { this.menuCollapsed = window.innerWidth < 1024; }
  logout(): void { if (confirm('Tem certeza?')) { this.authService.logout(); } }
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  calcularKPIs() { const abertos = this.chamados.filter(c => c.status === 'aberto').length; const emAndamento = this.chamados.filter(c => c.status === 'em-andamento').length; const concluidos = this.chamados.filter(c => c.status === 'fechado').length; const urgentes = this.chamados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length; this.kpis[0].value=abertos; this.kpis[1].value=emAndamento; this.kpis[2].value=concluidos; this.kpis[3].value=urgentes; }
  setFilter(key: any, value: any) { (this.filtros as any)[key] = value; }
  getChamadosFiltrados(): Chamado[] { let r = [...this.chamados]; if(this.filtros.busca.trim()){const b=this.filtros.busca.toLowerCase(); r=r.filter(c=>c.numeroProtocolo.toLowerCase().includes(b) || c.cliente.toLowerCase().includes(b) || c.descricao.toLowerCase().includes(b))} if(this.filtros.status!=='todos'){r=r.filter(c=>c.status===this.filtros.status)} return r; }
  getStatusLabel(s: string): string {
  const labels: { [key: string]: string } = {
    'aberto': 'Aberto',
    'em-andamento': 'Em Andamento',
    'fechado': 'Concluído'
  };
  return labels[s] || '';
}
getPrioridadeLabel(p: string): string {
  const labels: { [key: string]: string } = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'urgente': 'Urgente'
  };
  return labels[p] || '';
}
getPrioridadeClass(p: string): string {
  const classes: { [key: string]: string } = {
    'alta': 'prioridade-alta',
    'urgente': 'prioridade-alta',
    'media': 'prioridade-media',
    'baixa': 'prioridade-baixa'
  };
  return classes[p] || '';
}
  getStatusClass(s:string){return`status-${s.replace('-','')}`}
  formatarData(d:any){return new Date(d).toLocaleDateString('pt-BR')}
}