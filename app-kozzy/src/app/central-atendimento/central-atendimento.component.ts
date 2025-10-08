// src/app/central-atendimento.component.ts (CÓDIGO COMPLETO E CORRIGIDO)

import { Component, EventEmitter, Input, Output, OnInit, HostListener, OnDestroy } from '@angular/core';import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
import { AuthService, UsuarioLogado } from '../auth.service';
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';

// Interfaces locais para o componente
interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }

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
  // --- Propriedades de Controle de Modais ---
  showCreateModal: boolean = false; // Controla a visibilidade do modal de Criar/Editar
  chamadoSelecionado: Chamado | null = null; // Guarda o chamado para edição

  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;

  // --- Propriedades de Dados ---
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
  menuCollapsed: boolean = false;

  constructor(
    public chamadosService: ChamadosService,
    public authService: AuthService,
    private router: Router
  ) {}

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

    this.updateStatusCounts();
    this.updateMenuBadge();
  }

  ngOnDestroy(): void {
    if (this.chamadosSubscription) {
      this.chamadosSubscription.unsubscribe();
    }
  }

  // --- MÉTODOS PARA MODAL DE CRIAR/EDITAR CHAMADO ---

  abrirModalCriarChamado(): void {
    this.chamadoSelecionado = null; // Garante que não há um chamado selecionado
    this.showCreateModal = true;
  }

  abrirModalEdicao(chamado: Chamado): void {
    // Se o usuário for um atendente, verifica se o chamado pertence a ele
    if (this.usuarioLogado?.perfil === 'atendente' && chamado.atendente !== this.usuarioLogado.nome) {
      this.showToast('Você só pode editar os chamados que estão atribuídos a você.', 'warning');
      return; // Impede a abertura do modal
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
  
  // --- DEMAIS MÉTODOS DO COMPONENTE ---

  toggleMenu(): void {
    this.menuCollapsed = !this.menuCollapsed;
  }
  
  abrirModalBuscarCliente(): void {
    console.log('Abrir modal de busca de cliente - Funcionalidade em desenvolvimento');
  }

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
    setTimeout(() => {
      this.showRelatorioScreen = true;
    }, 100);
  }

  reabrirModalFiltros(): void {
    this.showRelatorioFiltrosModal = true;
  }

  fecharRelatorioScreen(): void {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.filtrosRelatorioSalvos = null;
  }

  getFiltrosSalvos(): RelatorioFilters | null {
    return this.filtrosRelatorioSalvos;
  }

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
    const labels: {[key: string]: string} = { 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Fechado' };
    return labels[status] || status;
  }

  getPrioridadeIcon(prioridade: string): string {
    const icons: {[key: string]: string} = { 'baixa': '⬇️', 'media': '➡️', 'alta': '⬆️', 'urgente': '🚨' };
    return icons[prioridade] || '';
  }

  getPrioridadeLabel(prioridade: string): string {
    const labels: {[key: string]: string} = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' };
    return labels[prioridade] || '';
  }

  formatDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    const dt = new Date(`${date}T${time}`);
    return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    const data = JSON.stringify(this.chamados, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chamados.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    this.toast = { message, type, visible: true };
    setTimeout(() => { this.toast.visible = false; }, 3000);
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.showToast('Logout realizado com sucesso!', 'success');
    }
  }
}