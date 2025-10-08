// src/app/central-atendimento/central-atendimento.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Serviços e interfaces
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
import { AuthService, UsuarioLogado } from '../auth.service';

// Componentes filhos
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';

// Interfaces locais
interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: number;
  active?: boolean;
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
    FormsModule,
    RouterModule,
    CreateTicketModalComponent,
    RelatorioFiltroModalComponent,
    RelatorioScreenComponent,
  ],
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css'],
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  // --- Controle de modais ---
  showCreateModal = false;
  chamadoSelecionado: Chamado | null = null;

  showRelatorioFiltrosModal = false;
  showRelatorioScreen = false;

  // --- Dados e estado ---
  chamados: Chamado[] = [];
  relatorioChamados: Chamado[] = [];
  chamadosSubscription!: Subscription;
  filtrosRelatorioSalvos: RelatorioFilters | null = null;
  currentFilter: string = 'todos';
  usuarioLogado: UsuarioLogado | null = null;

  menuItems: MenuItem[] = [];
  toast: ToastMessage = { message: '', type: 'info', visible: false };

  statusFilters = [
    { label: 'Todos', value: 'todos', icon: '📄', count: 0, active: true },
    { label: 'Abertos', value: 'aberto', icon: '🔴', count: 0, active: false },
    { label: 'Em Andamento', value: 'em-andamento', icon: '🟡', count: 0, active: false },
    { label: 'Fechados', value: 'fechado', icon: '🟢', count: 0, active: false },
  ];

  menuCollapsed = false;

  constructor(
    private chamadosService: ChamadosService,
    public authService: AuthService,
    private router: Router
  ) {}

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.usuarioLogado = this.authService.getUsuarioLogado();

    this.chamadosSubscription = this.chamadosService.chamados$.subscribe((chamados) => {
      this.chamados = chamados;
      this.updateStatusCounts();
      this.updateMenuBadge();
    });

    this.menuItems = [
      { label: 'Chamados', icon: '📞', route: '/central', active: true, badge: 0 },
      { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() },
      { label: 'Buscar Cliente', icon: '🔍', action: () => this.abrirModalBuscarCliente() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
    ];
  }

  ngOnDestroy(): void {
    this.chamadosSubscription?.unsubscribe();
  }

  // --- Modais de chamado ---
  abrirModalCriarChamado(): void {
    this.chamadoSelecionado = null;
    this.showCreateModal = true;
  }

  abrirModalEdicao(chamado: Chamado): void {
    if (this.usuarioLogado?.perfil === 'atendente' && chamado.atendente !== this.usuarioLogado.nome) {
      this.showToast('Você só pode editar os chamados atribuídos a você.', 'warning');
      return;
    }

    this.chamadoSelecionado = { ...chamado };
    this.showCreateModal = true;
  }

  fecharModal(): void {
    this.showCreateModal = false;
    this.chamadoSelecionado = null;
  }

  onChamadoCriado(novoChamado: NovoChamado): void {
    this.chamadosService.adicionarChamado(novoChamado);
    this.fecharModal();
  }

  onChamadoAtualizado(chamadoAtualizado: Chamado): void {
    this.chamadosService.atualizarChamado(chamadoAtualizado);
    this.fecharModal();
  }

  // --- Relatórios ---
  abrirModalRelatorios(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.showRelatorioFiltrosModal = true;
  }

  fecharModalRelatorioFiltros(): void {
    this.showRelatorioFiltrosModal = false;
  }

  onGerarRelatorio(filtros: RelatorioFilters): void {
    this.filtrosRelatorioSalvos = { ...filtros };
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    this.showRelatorioFiltrosModal = false;

    setTimeout(() => (this.showRelatorioScreen = true), 100);
  }

  reabrirModalFiltros(): void {
    this.showRelatorioFiltrosModal = true;
  }

  fecharRelatorioScreen(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.filtrosRelatorioSalvos = null;
  }

  // --- Utilitários ---
  updateStatusCounts(): void {
    this.statusFilters.forEach((filter) => {
      filter.count =
        filter.value === 'todos'
          ? this.chamados.length
          : this.chamados.filter((c) => c.status === filter.value).length;
    });
  }

  updateMenuBadge(): void {
    const item = this.menuItems.find((i) => i.label === 'Chamados');
    if (item) {
      item.badge = this.chamados.filter(
        (c) => c.status === 'aberto' || c.status === 'em-andamento'
      ).length;
    }
  }

  setFilter(value: string): void {
    this.currentFilter = value;
    this.statusFilters.forEach((f) => (f.active = f.value === value));
  }

  getFilteredChamados(): Chamado[] {
    return this.currentFilter === 'todos'
      ? this.chamados
      : this.chamados.filter((c) => c.status === this.currentFilter);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'aberto': 'Aberto',
      'em-andamento': 'Em Andamento',
      'fechado': 'Fechado',
    };
    return labels[status] || status;
  }

  getPrioridadeIcon(prioridade: string): string {
    const icons: Record<string, string> = {
      'baixa': '⬇️',
      'media': '➡️',
      'alta': '⬆️',
      'urgente': '🚨',
    };
    return icons[prioridade] || '';
  }

  getPrioridadeLabel(prioridade: string): string {
    const labels: Record<string, string> = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente',
    };
    return labels[prioridade] || '';
  }

  formatDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    const dt = new Date(`${date}T${time}`);
    return dt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTempoDecorrido(dataAbertura: string, horaAbertura: string): string {
    if (!dataAbertura || !horaAbertura) return '';
    const dataChamado = new Date(`${dataAbertura}T${horaAbertura}`);
    const agora = new Date();
    const diffMin = Math.round((agora.getTime() - dataChamado.getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}min`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ${diffMin % 60}min`;
    return `${Math.floor(diffMin / 1440)}d`;
  }

  exportarDados(): void {
    const blob = new Blob([JSON.stringify(this.chamados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chamados.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  showToast(message: string, type: ToastMessage['type']): void {
    this.toast = { message, type, visible: true };
    setTimeout(() => (this.toast.visible = false), 3000);
  }

  abrirModalBuscarCliente(): void {
    console.log('🔍 Buscar cliente — funcionalidade em desenvolvimento.');
  }

  toggleMenu(): void {
    this.menuCollapsed = !this.menuCollapsed;
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.showToast('Logout realizado com sucesso!', 'success');
    }
  }
}
