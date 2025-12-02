import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
import { AuthService, UsuarioLogado } from '../auth.service';

// Seus componentes (mantidos iguais)
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { SearchProtocolModalComponent } from '../search-protocol-modal/search-protocol-modal.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';

interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }

@Component({
  selector: 'app-central-atendimento',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CreateTicketModalComponent,
    RelatorioFiltroModalComponent,
    RelatorioScreenComponent,
    SearchProtocolModalComponent,
    TicketDetailComponent
  ],
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css'],
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  showCreateModal: boolean = false;
  showSearchModal: boolean = false;
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  showDetailScreen: boolean = false;

  chamadoSelecionado: Chamado | null = null;
  chamadoDetalhe: Chamado | null = null;
  
  chamados: Chamado[] = [];
  relatorioChamados: Chamado[] = [];
  chamadosSubscription!: Subscription;
  usuarioLogado: UsuarioLogado | null = null;
  
  menuItems: MenuItem[] = [];
  statusFilters = [
    { label: 'Todos', value: 'todos', icon: '📄', count: 0, active: true },
    { label: 'Abertos', value: 'aberto', icon: '🔴', count: 0, active: false },
    { label: 'Em Andamento', value: 'em-andamento', icon: '🟡', count: 0, active: false },
    { label: 'Fechados', value: 'fechado', icon: '🟢', count: 0, active: false },
  ];
  currentFilter: string = 'todos';
  menuCollapsed: boolean = false;
  filtrosRelatorioSalvos: RelatorioFilters | null = null;
  toast: ToastMessage = { message: '', type: 'info', visible: false };

  constructor(public chamadosService: ChamadosService, public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    // --- MUDANÇA 1: Carregar dados da API ao iniciar ---
    this.carregarListaDeChamados();

    this.menuItems = [
      { label: 'Chamados', icon: '📞', action: () => this.voltarParaLista(), active: true, badge: 0 },
      { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() },
      { label: 'Buscar Protocolo', icon: '🔍', action: () => this.abrirModalBuscaProtocolo() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
      { label: 'Design System', icon: '🎨', route: '/design-system' }
    ];
  }

  // --- NOVA FUNÇÃO PARA BUSCAR DO BACKEND ---
  carregarListaDeChamados() {
    this.chamadosService.getChamados().subscribe({
      next: (dadosVindosDaApi) => {
        this.chamados = dadosVindosDaApi;
        this.updateStatusCounts();
        this.updateMenuBadge();
      },
      error: (err) => {
        console.error('Erro ao carregar chamados', err);
        this.showToast('Erro ao carregar dados.', 'error');
      }
    });
  }

  ngOnDestroy(): void { if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); } }

  // --- LÓGICA DE NAVEGAÇÃO ---
  voltarParaLista(): void {
    this.showDetailScreen = false;
    this.showRelatorioScreen = false;
    this.chamadoDetalhe = null;
    this.setFilter('todos');
    // Opcional: recarregar a lista ao voltar
    this.carregarListaDeChamados();
  }

  onSelectChamado(chamado: Chamado): void {
    this.chamadoDetalhe = chamado;
    this.showDetailScreen = true;
    this.showRelatorioScreen = false;
  }

  fecharTelaDetalhes(): void {
    this.showDetailScreen = false;
    this.chamadoDetalhe = null;
  }

  abrirModalRelatorios(): void {
    this.showDetailScreen = false;
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.showRelatorioFiltrosModal = true;
  }

  // --- BUSCA ---
  abrirModalBuscaProtocolo() { this.showSearchModal = true; }
  fecharModalBusca() { this.showSearchModal = false; }
  
  onBuscarProtocolo(p: string) {
    // Ajuste aqui se você criar uma rota de busca no backend depois
    const encontrado = this.chamados.find(c => c.numeroProtocolo === p);
    
    if(encontrado) { 
        this.showSearchModal=false; 
        this.onSelectChamado(encontrado); 
        this.showToast('Encontrado!', 'success'); 
    } else { 
        this.showToast('Protocolo não encontrado nesta lista.', 'warning'); 
    }
  }

  // --- EDIÇÃO ---
  onEditarAPartirDoDetalhe(chamado: Chamado) {
    if (this.usuarioLogado?.perfil === 'atendente' && chamado.atendente !== this.usuarioLogado.nome) {
      this.showToast('Você só pode editar seus próprios chamados.', 'error');
      return;
    }
    this.abrirModalEdicao(chamado);
  }

  abrirModalEdicao(c: Chamado) { this.chamadoSelecionado = { ...c }; this.showCreateModal = true; }
  
  // --- MÉTODOS CRUD (CONECTADOS NA API) ---
  abrirModalCriarChamado() { this.chamadoSelecionado = null; this.showCreateModal = true; }
  fecharModal() { this.showCreateModal = false; this.chamadoSelecionado = null; }

  // --- MUDANÇA 2: Enviar para API via Service ---
  onChamadoCriado(n: NovoChamado) { 
    this.chamadosService.criarChamado(n).subscribe({
        next: (res) => {
            this.showToast('Chamado criado com sucesso!', 'success');
            this.fecharModal();
            // Atualiza a lista na tela com o novo item que veio do banco
            this.carregarListaDeChamados();
        },
        error: (err) => {
            console.error(err);
            this.showToast('Erro ao salvar chamado.', 'error');
        }
    });
  }

  onChamadoAtualizado(c: Chamado) { 
      // Assumindo que você terá um método 'atualizarChamado' no service no futuro
      // Por enquanto, vamos recarregar a lista para garantir sincronia
      this.showToast('Funcionalidade de atualização em desenvolvimento no back.', 'info');
      /* this.chamadosService.atualizarChamado(c).subscribe({
        next: () => {
           this.fecharModal();
           this.carregarListaDeChamados();
           this.showToast('Atualizado!', 'success');
        }
      });
      */
  }

  // --- RELATÓRIO ---
  fecharModalRelatorioFiltros() { this.showRelatorioFiltrosModal = false; }
  
  onGerarRelatorio(f: RelatorioFilters) { 
      // Nota: buscarChamadosPorFiltros tbm precisaria virar Observable se for filtrar no back
      // Por enquanto mantemos filtragem local se a lista estiver carregada
      this.filtrosRelatorioSalvos={...f}; 
      // Lógica simplificada local:
      this.relatorioChamados = this.chamados.filter(c => 
          (!f.status || c.status === f.status) &&
          (!f.dataInicio || c.data >= f.dataInicio)
      );
      this.showRelatorioFiltrosModal=false; 
      setTimeout(()=>{this.showRelatorioScreen=true},100); 
  }
  
  fecharRelatorioScreen() { this.showRelatorioScreen=false; this.relatorioChamados=[]; }
  reabrirModalFiltros() { this.showRelatorioFiltrosModal=true; }

  // --- UTILS ---
  toggleMenu() { this.menuCollapsed = !this.menuCollapsed; }
  
  updateStatusCounts() { 
      this.statusFilters.forEach(f => { 
          f.count = f.value==='todos' ? this.chamados.length : this.chamados.filter(c=>c.status===f.value).length; 
      }); 
  }
  
  updateMenuBadge() { 
      const i=this.menuItems.find(x=>x.label==='Chamados'); 
      if(i) i.badge=this.chamados.filter(c=>['aberto','em-andamento'].includes(c.status)).length; 
  }
  
  setFilter(v: string) { this.currentFilter=v; this.statusFilters.forEach(f=>f.active=f.value===v); }
  getFilteredChamados() { return this.currentFilter==='todos' ? this.chamados : this.chamados.filter(c=>c.status===this.currentFilter); }
  getStatusLabel(s:string) { return s; } 
  formatDateTime(d:string,t:string) { return d + ' ' + t; }
  
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  
  logout() { 
      if(confirm('Sair?')) {
          this.authService.logout(); 
          // O authService.logout() já redireciona, mas se precisar forçar:
          // this.router.navigate(['/login']);
      }
  }
}