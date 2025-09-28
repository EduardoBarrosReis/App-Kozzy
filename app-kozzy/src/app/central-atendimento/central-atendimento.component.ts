import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterModule } from '@angular/router';
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';


interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: number;
  active?: boolean;
}

interface Usuario {
  nome: string;
  email: string;
}
interface ToastMessage {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  visible: boolean;
}
@Component({
  selector: 'app-central-atendimento',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    CreateTicketModalComponent,
    RelatorioFiltroModalComponent,
    RelatorioScreenComponent,
    // BuscarClienteModalComponent // Removido temporariamente para evitar erros de compilação
  ],
  templateUrl: './central-atendimento.component.html',
  styleUrl: './central-atendimento.component.css',
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  menuCollapsed: boolean = false;
  showCreateModal: boolean = false;
  showBuscarClienteModal: boolean = false; // Controla a visibilidade do modal de busca
  showRelatorioFiltrosModal: boolean = false; // Controla a visibilidade do modal de filtros de relatório
  showRelatorioScreen: boolean = false; // Controla a visibilidade da tela de relatório

  chamados: Chamado[] = [];
  relatorioChamados: Chamado[] = [];
  chamadosSubscription!: Subscription;

  // Persistência dos filtros de relatório
  filtrosRelatorioSalvos: RelatorioFilters | null = null;

  currentFilter: string = 'todos';

  usuarioLogado: Usuario|null = { nome: 'Usuário Teste', email: 'teste@kozzy.com' };

  menuItems: MenuItem[] = [];
toast: ToastMessage = {
    message: '',
    type: 'info',
    visible: false
  };
  statusFilters = [
    { label: 'Todos', value: 'todos', icon: '📄', count: 0, active: true },
    { label: 'Abertos', value: 'aberto', icon: '🔴', count: 0, active: false },
    { label: 'Em Andamento', value: 'em-andamento', icon: '🟡', count: 0, active: false },
    { label: 'Fechados', value: 'fechado', icon: '🟢', count: 0, active: false },
  ];

  constructor(private chamadosService: ChamadosService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.chamadosSubscription = this.chamadosService.chamados$.subscribe((chamados) => {
      this.chamados = chamados;
      this.updateStatusCounts();
      this.updateMenuBadge();
    });

    this.menuItems = [
      { label: 'Chamados', icon: '📞', route: '/central-atendimento', active: true, badge: 0 },
      { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() },
      { label: 'Buscar Cliente', icon: '🔍', action: () => this.abrirModalBuscarCliente() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
    ];

    this.updateStatusCounts();
    this.updateMenuBadge();
  }

  ngOnDestroy(): void {
    this.chamadosSubscription.unsubscribe();
  }

  toggleMenu(): void {
    this.menuCollapsed = !this.menuCollapsed;
  }

  // Métodos para o modal de criação de chamado
  abrirModalCriarChamado(): void {
    this.showCreateModal = true;
  }

  fecharModalCriarChamado(): void {
    this.showCreateModal = false;
  }

  onChamadoCriado(novoChamado: NovoChamado): void {
    this.chamadosService.adicionarChamado(novoChamado);
    this.fecharModalCriarChamado();
  }

  // Métodos para o modal de busca de cliente
  abrirModalBuscarCliente(): void {
    // Implementar a lógica para abrir o modal de busca de cliente
    // this.showBuscarClienteModal = true;
    console.log('Abrir modal de busca de cliente - Funcionalidade em desenvolvimento');
  }

  fecharModalBuscarCliente(): void {
    this.showBuscarClienteModal = false;
  }

  // Métodos para o sistema de relatórios - COM PERSISTÊNCIA DE FILTROS
  abrirModalRelatorios(): void {
    // Primeiro, garantir que a tela de relatório está fechada
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    
    // Depois, abrir APENAS o modal de filtros
    this.showRelatorioFiltrosModal = true;
  }

  fecharModalRelatorioFiltros(): void {
    this.showRelatorioFiltrosModal = false;
  }

  onGerarRelatorio(filtros: RelatorioFilters): void {
    // Salvar os filtros para persistência
    this.filtrosRelatorioSalvos = { ...filtros };
    
    // Buscar os dados do relatório
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    
    // Fechar o modal de filtros PRIMEIRO
    this.showRelatorioFiltrosModal = false;
    
    // Aguardar um pequeno delay para garantir que o modal seja fechado antes de abrir a tela
    setTimeout(() => {
      this.showRelatorioScreen = true;
    }, 100);
  }

  // Método para reabrir o modal de filtros a partir da tela de relatório
  reabrirModalFiltros(): void {
    // Manter a tela de relatório aberta, mas abrir o modal de filtros por cima
    this.showRelatorioFiltrosModal = true;
  }

  fecharRelatorioScreen(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = []; // Limpa os dados do relatório ao fechar a tela
    
    // RESETAR os filtros salvos quando sair completamente da tela de relatórios
    this.filtrosRelatorioSalvos = null;
  }

  // Método para obter os filtros salvos (será usado pelo modal)
  getFiltrosSalvos(): RelatorioFilters | null {
    return this.filtrosRelatorioSalvos;
  }

  // Métodos para filtros e exibição de chamados
  updateStatusCounts(): void {
    this.statusFilters.forEach((filter) => {
      if (filter.value === 'todos') {
        filter.count = this.chamados.length;
      } else {
        filter.count = this.chamados.filter((c) => c.status === filter.value).length;
      }
    });
  }

  updateMenuBadge(): void {
    const chamadosItem = this.menuItems.find((item) => item.label === 'Chamados');
    if (chamadosItem) {
      chamadosItem.badge = this.chamados.filter((c) => c.status === 'aberto' || c.status === 'em-andamento').length;
    }
  }

  setFilter(filterValue: string): void {
    this.currentFilter = filterValue;
    this.statusFilters.forEach((filter) => (filter.active = filter.value === filterValue));
  }

  getFilteredChamados(): Chamado[] {
    if (this.currentFilter === 'todos') {
      return this.chamados;
    }
    return this.chamados.filter((chamado) => chamado.status === this.currentFilter);
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
        return status;
    }
  }

  getPrioridadeIcon(prioridade: string): string {
    switch (prioridade) {
      case 'baixa':
        return '⬇️';
      case 'media':
        return '➡️';
      case 'alta':
        return '⬆️';
      case 'urgente':
        return '🚨';
      default:
        return '';
    }
  }

  getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
      case 'baixa':
        return 'Baixa';
      case 'media':
        return 'Média';
      case 'alta':
        return 'Alta';
      case 'urgente':
        return 'Urgente';
      default:
        return '';
    }
  }

  formatDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const dt = new Date(year, month - 1, day, hours, minutes);
    return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getTempoDecorrido(dataAbertura: string, horaAbertura: string): string {
    if (!dataAbertura || !horaAbertura) return '';

    const [ano, mes, dia] = dataAbertura.split('-').map(Number);
    const [horas, minutos] = horaAbertura.split(':').map(Number);
    const dataChamado = new Date(ano, mes - 1, dia, horas, minutos);
    const agora = new Date();

    const diffMs = agora.getTime() - dataChamado.getTime();
    const diffMin = Math.round(diffMs / (1000 * 60));

    if (diffMin < 60) {
      return `${diffMin}min`;
    } else if (diffMin < 24 * 60) {
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ${diffMin % 60}min`;
    } else {
      const diffDays = Math.floor(diffMin / (24 * 60));
      return `${diffDays}d ${Math.floor((diffMin % (24 * 60)) / 60)}h`;
    }
  }

  abrirChamado(chamado: Chamado): void {
    console.log('Abrir detalhes do chamado:', chamado);
    // Implementar navegação para a tela de detalhes do chamado
  }

  exportarDados(): void {
    const dataToExport = JSON.stringify(this.chamados, null, 2);
    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chamados.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Exportando dados...');
  }
showToast(message: string, type: 'success' | 'info' | 'warning' | 'error') {
    this.toast = {
      message,
      type,
      visible: true
    };

    // Auto-hide após 2 segundos
    setTimeout(() => {
      this.toast.visible = false;
    }, 2000);
  }
  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.showToast('Logout realizado com sucesso!', 'success');
      // O redirecionamento é feito automaticamente pelo AuthService
    }
  }

}

