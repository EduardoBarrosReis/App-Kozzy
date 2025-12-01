import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, UsuarioLogado } from '../auth.service';
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';

import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { CriarUsuarioModalComponent } from '../criar-usuario-modal/criar-usuario-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component'; 
import { SearchProtocolModalComponent } from '../search-protocol-modal/search-protocol-modal.component';

interface KPI { label: string; value: number; color: string; icon: string; }
interface FilterOptions { busca: string; status: string; prioridade: string; ordenacao: string; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }
interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    CreateTicketModalComponent,
    CriarUsuarioModalComponent,
    RelatorioFiltroModalComponent, 
    RelatorioScreenComponent,
    TicketDetailComponent,
    SearchProtocolModalComponent
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  showTicketModal: boolean = false;
  showCriarUsuarioModal: boolean = false;
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  showSearchModal: boolean = false;
  showDetailScreen: boolean = false;
  
  chamadoDetalhe: Chamado | null = null;
  chamadoSelecionado: Chamado | null = null;
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
    public authService: AuthService,
    private chamadosService: ChamadosService
  ) {}

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    this.menuItems = [
      { label: 'Visão Geral', icon: '👑', action: () => this.voltarParaDashboard(), active: true },
      { label: 'Buscar Protocolo', icon: '🔍', action: () => this.abrirModalBuscaProtocolo() },
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
    if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); } 
    window.removeEventListener('resize', this.checkScreenSize.bind(this)); 
  }

  // --- LÓGICA DE TROCA DE TELA ---
  
  // 1. Reseta tudo para mostrar a Dashboard
  voltarParaDashboard(): void {
    this.showDetailScreen = false;
    this.showRelatorioScreen = false;
    this.chamadoDetalhe = null;
    this.setFilter('status', 'todos');
  }

  // 2. Abre o Detalhe e ESCONDE o Relatório
  onSelectChamado(chamado: Chamado): void {
    console.log('Selecionado:', chamado.numeroProtocolo); // Debug
    this.chamadoDetalhe = chamado;
    this.showDetailScreen = true;
    
    // CRUCIAL: Esconde o relatório para não sobrepor
    this.showRelatorioScreen = false; 
  }

  fecharTelaDetalhes(): void {
    this.showDetailScreen = false;
    this.chamadoDetalhe = null;
    // Se quiser voltar para o relatório ao invés do dashboard, teria que guardar estado,
    // mas por padrão volta para dashboard ou deixa o relatório visível se não setarmos false.
    // Como setamos false no onSelectChamado, voltamos pro dashboard.
  }

  abrirModalRelatorios(): void { 
    this.showDetailScreen = false; // Fecha detalhe se estiver aberto
    this.showRelatorioScreen = false; 
    this.relatorioChamados = []; 
    this.showRelatorioFiltrosModal = true; 
  }

  // ... (Outros métodos de busca e modal iguais aos anteriores)
  abrirModalBuscaProtocolo() { this.showSearchModal = true; }
  fecharModalBusca() { this.showSearchModal = false; }
  onBuscarProtocolo(p: string) {
    const c = this.chamadosService.buscarPorProtocolo(p);
    if(c) { this.showSearchModal=false; this.onSelectChamado(c); this.showToast('Encontrado!', 'success'); }
    else { this.showToast('Não encontrado.', 'warning'); }
  }

  onEditarAPartirDoDetalhe(chamado: Chamado) {
    if (this.usuarioLogado?.perfil === 'supervisor') {
        this.abrirModalEdicao(chamado);
    } else {
        this.showToast('Apenas Supervisores podem editar.', 'error');
    }
  }

  // Métodos CRUD
  abrirModalEdicao(c: Chamado) { this.chamadoSelecionado = { ...c }; this.showTicketModal = true; }
  fecharTicketModal() { this.showTicketModal = false; this.chamadoSelecionado = null; }
  
  onChamadoAtualizado(c: Chamado) {
    this.chamadosService.atualizarChamado(c);
    this.fecharTicketModal();
    if (this.showDetailScreen && this.chamadoDetalhe?.id === c.id) { this.chamadoDetalhe = c; }
    this.showToast('Atualizado com sucesso!', 'success');
  }
  
  abrirModalCriarChamado() { this.chamadoSelecionado = null; this.showTicketModal = true; }
  onChamadoCriado(n: NovoChamado) {
    this.chamadosService.adicionarChamado(n);
    this.fecharTicketModal();
    this.showToast('Criado com sucesso!', 'success');
  }

  // Métodos auxiliares
  abrirModalCriarUsuario() { this.showCriarUsuarioModal = true; }
  fecharModalCriarUsuario() { this.showCriarUsuarioModal = false; }
  onUsuarioCriado(msg: string) { this.showToast(msg, 'success'); this.fecharModalCriarUsuario(); }
  fecharModalRelatorioFiltros() { this.showRelatorioFiltrosModal = false; }
  onGerarRelatorio(filtros: RelatorioFilters) { 
      this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros); 
      this.showRelatorioFiltrosModal = false; 
      setTimeout(() => { this.showRelatorioScreen = true; }, 100); 
  }
  fecharRelatorioScreen() { this.showRelatorioScreen = false; this.relatorioChamados = []; }
  
  checkScreenSize() { this.menuCollapsed = window.innerWidth < 1024; }
  logout() { if (confirm('Sair?')) this.authService.logout(); }
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  
  // Getters/Formatters
  calcularKPIs() { const abertos = this.chamados.filter(c => c.status === 'aberto').length; const emAndamento = this.chamados.filter(c => c.status === 'em-andamento').length; const concluidos = this.chamados.filter(c => c.status === 'fechado').length; const urgentes = this.chamados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length; this.kpis[0].value=abertos; this.kpis[1].value=emAndamento; this.kpis[2].value=concluidos; this.kpis[3].value=urgentes; }
  setFilter(key: any, value: any) { (this.filtros as any)[key] = value; }
  getChamadosFiltrados(): Chamado[] { let r = [...this.chamados]; if(this.filtros.busca.trim()){const b=this.filtros.busca.toLowerCase(); r=r.filter(c=>c.numeroProtocolo.toLowerCase().includes(b) || c.cliente.toLowerCase().includes(b) || c.descricao.toLowerCase().includes(b))} if(this.filtros.status!=='todos'){r=r.filter(c=>c.status===this.filtros.status)} return r; }
  getStatusLabel(s: string) { const l:any={ 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Concluído' }; return l[s] || ''; }
  getPrioridadeLabel(p: string) { const l:any={ 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' }; return l[p] || ''; }
  getPrioridadeClass(p: string) { const c:any={ 'alta': 'prioridade-alta', 'urgente': 'prioridade-alta', 'media': 'prioridade-media', 'baixa': 'prioridade-baixa' }; return c[p] || ''; }
  getStatusClass(s:string){return`status-${s.replace('-','')}`}
  formatarData(d:any){return new Date(d).toLocaleDateString('pt-BR')}
}