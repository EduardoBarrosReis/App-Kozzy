// supervisor-dashboard.component.ts (VERSÃO COM LÓGICA DE RELATÓRIOS)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ChamadosService, Chamado, RelatorioFilters } from '../chamados.service'; // Importa Chamado e RelatorioFilters
import { Subscription } from 'rxjs';
// IMPORTAÇÕES DOS COMPONENTES DE MODAL
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';

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
    CommonModule,
    RouterModule,
    FormsModule,
    RelatorioFiltroModalComponent, // Adicionado
    RelatorioScreenComponent      // Adicionado
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  // --- PROPRIEDADES DE CONTROLE DE TELA E MODAIS (CLONADAS) ---
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  relatorioChamados: Chamado[] = [];
  
  // --- Demais propriedades ---
  menuCollapsed: boolean = false;
  menuItems: MenuItem[] = [];
  usuarioLogado: Usuario | null = null;
  filtros: FilterOptions = { busca: '', status: 'todos', prioridade: 'todas', ordenacao: 'mais-recentes' };
  toast: ToastMessage = { message: '', type: 'info', visible: false };
  kpis: KPI[] = [ /* ... */ ];
  chamados: Chamado[] = [];
  private chamadosSubscription!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private chamadosService: ChamadosService
  ) {}

  ngOnInit() {
    // ... (lógica do ngOnInit permanece a mesma)
    if (!this.authService.isLogado() || !this.authService.isSupervisor()) { this.router.navigate(['/login']); return; }
    this.usuarioLogado = this.authService.getUsuarioLogado();
    this.menuItems = [
      { label: 'Supervisor', icon: '👑', route: '/supervisor', active: true },
      { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() },
      { label: 'Buscar Cliente', icon: '🔍', action: () => this.abrirModalBuscarCliente() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
    ];
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.chamadosSubscription = this.chamadosService.chamados$.subscribe(novosChamados => {
      this.chamados = novosChamados; this.calcularKPIs(); this.updateMenuBadge();
    });
  }

  ngOnDestroy() {
    // ... (lógica do ngOnDestroy permanece a mesma)
    if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); }
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  // --- MÉTODOS DE RELATÓRIO (CLONADOS DA CENTRAL) ---
  abrirModalRelatorios(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.showRelatorioFiltrosModal = true;
  }

  fecharModalRelatorioFiltros(): void {
    this.showRelatorioFiltrosModal = false;
  }

  onGerarRelatorio(filtros: RelatorioFilters): void {
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    this.showRelatorioFiltrosModal = false;
    setTimeout(() => { this.showRelatorioScreen = true; }, 100);
  }

  fecharRelatorioScreen(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
  }
  
  // --- DEMAIS MÉTODOS ---
  // ... (toda a sua lógica de logout, checkScreenSize, abrir modais beta, calcularKPIs, filtros, etc.)
  checkScreenSize() { this.menuCollapsed = window.innerWidth < 1024; }
  logout(): void { if (confirm('Tem certeza?')) { this.authService.logout(); } }
  abrirModalCriarChamado(): void { this.showToast('Funcionalidade "Novo Atendimento" indisponível para supervisor.', 'info'); }
  abrirModalBuscarCliente(): void { this.showToast('Funcionalidade "Buscar Cliente" indisponível para supervisor.', 'info'); }
  updateMenuBadge(): void { const i=this.menuItems.find(i=>i.label==='Chamados');if(i){i.badge=this.chamados.filter(c=>c.status==='aberto'||c.status==='em-andamento').length;}}
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  calcularKPIs() { const abertos = this.chamados.filter(c => c.status === 'aberto').length; const emAndamento = this.chamados.filter(c => c.status === 'em-andamento').length; const concluidos = this.chamados.filter(c => c.status === 'fechado').length; const urgentes = this.chamados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length; this.kpis.forEach(k=>k.value=0); this.kpis.find(k=>k.label==='Abertos')!.value=abertos; this.kpis.find(k=>k.label==='Em Andamento')!.value=emAndamento; this.kpis.find(k=>k.label==='Concluídos')!.value=concluidos; this.kpis.find(k=>k.label==='Urgentes')!.value=urgentes; }
  setFilter(key: any, value: any) { (this.filtros as any)[key] = value; }
  getChamadosFiltrados(): Chamado[] { let r = [...this.chamados]; if(this.filtros.busca.trim()){const b=this.filtros.busca.toLowerCase();r=r.filter(c=>(c as any).numeroProtocolo.toLowerCase().includes(b)||(c as any).cliente.toLowerCase().includes(b)||(c as any).descricao.toLowerCase().includes(b))}if(this.filtros.status!=='todos'){r=r.filter(c=>c.status===this.filtros.status)}if(this.filtros.prioridade!=='todas'){r=r.filter(c=>c.prioridade===(this.filtros as any).prioridade)}return r; }
  getStatusLabel(s:string){return{'aberto':'Aberto','em-andamento':'Em Andamento','fechado':'Concluído'}[s]||''}
  getPrioridadeLabel(p:string){return{'baixa':'Baixa','media':'Média','alta':'Alta','urgente':'Urgente'}[p]||''}
  getPrioridadeClass(p:string){return{'alta':'prioridade-alta','urgente':'prioridade-alta','media':'prioridade-media','baixa':'prioridade-baixa'}[p]||''}
  getStatusClass(s:string){return`status-${s.replace('-','')}`}
  formatarData(d:any){return new Date(d).toLocaleDateString('pt-BR')}
}