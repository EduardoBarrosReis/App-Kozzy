import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service'; // Ajuste o caminho conforme necessário
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component'; // Ajuste o caminho conforme necessário
import { BuscarClienteComponent } from '../buscar-cliente/buscar-cliente.component'; // NOVO: Importar o modal de busca
import { RelatorioFiltroModalComponent, RelatorioFilters } from '../relatorio-filtro-modal/relatorio-filtro-modal.component'; // NOVO: Importar o modal de filtros de relatório
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component'; // NOVO: Importar o componente de tabela de relatório
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component'; // NOVO: Importar o componente de tela de relatório
import { ChamadosService, Chamado, NovoChamado } from '../chamados.service'; // Ajuste o caminho conforme necessário

interface MenuItem {
  label: string;
  route?: string; // Tornar route opcional para itens que abrem modais
  action?: () => void; // Adicionar propriedade action para funções
  icon: string;
  active?: boolean;
  badge?: number;
}

interface StatusFilter {
  label: string;
  value: string;
  count: number;
  active: boolean;
  icon: string;
}

@Component({
  selector: 'app-central-atendimento',
  standalone: true,
  imports: [CommonModule, RouterModule, CreateTicketModalComponent, BuscarClienteComponent, RelatorioFiltroModalComponent, RelatorioTabelaComponent, RelatorioScreenComponent], // NOVO: Adicionar RelatorioScreenComponent
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css']
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  menuCollapsed = false;
  currentFilter = 'todos';
  usuarioLogado: any = null;
  showCreateModal = false;
  showBuscarClienteModal = false; // NOVO: Variável para controlar a visibilidade do modal de busca
  showRelatorioFiltrosModal = false; // Variável para controlar a visibilidade do modal de filtros de relatório
  showRelatorioScreen = false; // NOVO: Variável para controlar a visibilidade da tela de relatório
  relatorioChamados: Chamado[] = []; // Dados para a tabela de relatório
  isLoading = false;
  
  chamados: Chamado[] = [];
  private chamadosSubscription?: Subscription;
  
  menuItems: MenuItem[] = [
    { label: 'Chamados', route: '/central', icon: '📞', active: true, badge: 0 },
    { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() }, // Modificado para usar action
    { label: 'Buscar Cliente', icon: '🔍', action: () => this.abrirModalBuscarCliente() }, // Item para abrir o modal de busca
    { label: 'Relatórios', icon: '📊', action: () => this.abrirTelaRelatorios() }, // Modificado para abrir a tela de relatórios
    { label: 'Configurações', route: '/configuracoes', icon: '⚙️' }
  ];

  statusFilters: StatusFilter[] = [
    { label: 'Todos', value: 'todos', count: 0, active: true, icon: '📋' },
    { label: 'Abertos', value: 'aberto', count: 0, active: false, icon: '🔴' },
    { label: 'Em Andamento', value: 'em-andamento', count: 0, active: false, icon: '🟡' },
    { label: 'Fechados', value: 'fechado', count: 0, active: false, icon: '🟢' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private chamadosService: ChamadosService
  ) {}

  ngOnInit() {
    // Verificar se o usuário está logado
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Obter dados do usuário logado
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    // Subscrever aos chamados do serviço
    this.chamadosSubscription = this.chamadosService.getChamados().subscribe(
      chamados => {
        this.chamados = chamados;
        this.updateFilterCounts();
        this.updateMenuBadge();
        console.log('📊 Chamados atualizados:', chamados.length);
      }
    );
  }

  ngOnDestroy() {
    // Limpar subscription para evitar memory leaks
    if (this.chamadosSubscription) {
      this.chamadosSubscription.unsubscribe();
    }
  }

  // Método de logout
  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      // O redirecionamento é feito automaticamente pelo AuthService
    }
  }

  // Abrir modal de criação de chamado
  abrirModalCriarChamado(): void {
    this.showCreateModal = true;
  }

  // Fechar modal de criação de chamado
  fecharModalCriarChamado(): void {
    this.showCreateModal = false;
  }

  // Abrir modal de busca de cliente
  abrirModalBuscarCliente(): void {
    this.showBuscarClienteModal = true;
  }

  // Fechar modal de busca de cliente
  fecharModalBuscarCliente(): void {
    this.showBuscarClienteModal = false;
  }

  // NOVO: Abrir a tela de relatórios (que contém o botão para abrir o modal de filtros)
  abrirTelaRelatorios(): void {
    this.showRelatorioScreen = true;
    this.showRelatorioFiltrosModal = true; // Abre o modal de filtros automaticamente ao entrar na tela de relatórios
  }

  // Abrir modal de filtros de relatório
  abrirModalRelatorioFiltros(): void {
    this.showRelatorioFiltrosModal = true;
  }

  // Fechar modal de filtros de relatório
  fecharModalRelatorioFiltros(): void {
    this.showRelatorioFiltrosModal = false;
  }

  // Processar filtros do relatório
  onGerarRelatorio(filtros: RelatorioFilters): void {
    console.log("Gerar relatório com filtros:", filtros);
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    this.showRelatorioScreen = true; // Garante que a tela de relatório esteja visível
    this.fecharModalRelatorioFiltros();
  }

  // NOVO: Fechar a tela de relatório
  fecharRelatorioScreen(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
  }

  // Processar novo chamado criado
  onChamadoCriado(novoChamado: NovoChamado): void {
    this.isLoading = true;

    try {
      // Usar o serviço para adicionar o chamado
      const chamadoAdicionado = this.chamadosService.adicionarChamado(novoChamado);
      
      // Fechar modal
      this.fecharModalCriarChamado();

      console.log(`✅ Chamado #${novoChamado.numeroProtocolo} criado e persistido com sucesso!`);

    } catch (error) {
      console.error('❌ Erro ao processar novo chamado:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Atualizar badge do menu
  updateMenuBadge(): void {
    const chamadosItem = this.menuItems.find(item => item.label === 'Chamados');
    if (chamadosItem) {
      chamadosItem.badge = this.chamados.length;
    }
  }

  toggleMenu() {
    this.menuCollapsed = !this.menuCollapsed;
  }

  setFilter(filterValue: string) {
    this.currentFilter = filterValue;
    this.statusFilters.forEach(filter => {
      filter.active = filter.value === filterValue;
    });
  }

  getFilteredChamados() {
    if (this.currentFilter === 'todos') {
      return this.chamados;
    }
    return this.chamados.filter(chamado => chamado.status === this.currentFilter);
  }

  updateFilterCounts() {
    this.statusFilters.forEach(filter => {
      if (filter.value === 'todos') {
        filter.count = this.chamados.length;
      } else {
        filter.count = this.chamados.filter(c => c.status === filter.value).length;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aberto':
        return 'status-aberto';
      case 'em-andamento':
        return 'status-andamento';
      case 'fechado':
        return 'status-fechado';
      default:
        return 'status-default';
    }
  }

  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return 'prioridade-urgente';
      case 'alta':
        return 'prioridade-alta';
      case 'media':
        return 'prioridade-media';
      case 'baixa':
        return 'prioridade-baixa';
      default:
        return 'prioridade-media';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em-andamento':
        return 'Em Andamento';
      case 'fechado':
        return 'Fechado';
      default:
        return 'Desconhecido';
    }
  }

  getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return 'Urgente';
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return 'Normal';
    }
  }

  getPrioridadeIcon(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return '🔴';
      case 'alta':
        return '🟠';
      case 'media':
        return '🟡';
      case 'baixa':
        return '🟢';
      default:
        return '⚪';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  formatDateTime(dateString: string, timeString: string): string {
    const date = new Date(dateString + 'T' + timeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcular tempo decorrido desde a abertura
  getTempoDecorrido(dataAbertura: string, horaAbertura: string): string {
    const agora = new Date();
    const abertura = new Date(dataAbertura + 'T' + horaAbertura);
    const diffMs = agora.getTime() - abertura.getTime();
    
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHoras > 0) {
      return `${diffHoras}h ${diffMinutos}min`;
    } else {
      return `${diffMinutos}min`;
    }
  }

  // Abrir detalhes do chamado
  abrirChamado(chamado: Chamado) {
    console.log('Abrindo chamado:', chamado);
    // Implementar navegação para detalhes do chamado
    // this.router.navigate(['/chamado', chamado.id]);
  }

  // Exportar dados usando o serviço
  exportarDados(): void {
    try {
      const dadosJson = this.chamadosService.exportarDados();
      const blob = new Blob([dadosJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chamados_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      console.log('📁 Dados exportados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
    }
  }

  // Atualizar status do chamado usando o serviço
  atualizarStatus(chamado: Chamado, novoStatus: 'aberto' | 'em-andamento' | 'fechado'): void {
    this.chamadosService.atualizarStatus(chamado.id, novoStatus);
  }

  // Buscar chamados usando o serviço
  buscarChamados(termo: string): void {
    if (termo.trim()) {
      const resultados = this.chamadosService.buscarChamadosPorCliente(termo);
      console.log(`🔍 Encontrados ${resultados.length} chamados para "${termo}"`);
      // Implementar exibição dos resultados da busca
    }
  }

  // Limpar todos os dados (função administrativa)
  limparTodosDados(): void {
    this.chamadosService.limparTodosDados();
  }
}