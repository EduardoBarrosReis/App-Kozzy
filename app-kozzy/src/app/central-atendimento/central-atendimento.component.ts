import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Ajuste o caminho conforme necessário

interface Chamado {
  id: string;
  numero: string;
  cliente: string;
  descricao: string;
  status: 'aberto' | 'em-andamento' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  dataAbertura: string;
  tempoResposta: string;
  categoria: string;
  icone: string;
}

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  active?: boolean;
  badge?: number;
}

interface StatusFilter {
  label: string;
  value: string;
  count: number;
  active: boolean;
}

@Component({
  selector: 'app-central-atendimento',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css']
})
export class CentralAtendimentoComponent {
  menuCollapsed = false;
  currentFilter = 'todos';
  usuarioLogado: any = null;
  
  menuItems: MenuItem[] = [
    { label: 'Chamados', route: '/chamados', icon: '📞', active: true, badge: 12 },
    { label: 'Novo Atendimento', route: '/novo-atendimento', icon: '➕' },
    { label: 'Buscar Cliente', route: '/buscar-cliente', icon: '🔍' },
    { label: 'Relatórios', route: '/relatorios', icon: '📊' },
    { label: 'Configurações', route: '/configuracoes', icon: '⚙️' }
  ];

  statusFilters: StatusFilter[] = [
    { label: 'Todos', value: 'todos', count: 12, active: true },
    { label: 'Abertos', value: 'aberto', count: 5, active: false },
    { label: 'Em Andamento', value: 'em-andamento', count: 4, active: false },
    { label: 'Fechados', value: 'fechado', count: 3, active: false }
  ];

  chamados: Chamado[] = [
    {
      id: '1',
      numero: '#10234',
      cliente: 'João da Silva',
      descricao: 'Problema de conexão com a internet, cliente relatando lentidão',
      status: 'em-andamento',
      prioridade: 'alta',
      dataAbertura: '2024-01-15',
      tempoResposta: '2h 30min',
      categoria: 'Técnico',
      icone: '🔧'
    },
    {
      id: '2',
      numero: '#10235',
      cliente: 'Maria Oliveira',
      descricao: 'Cobrança indevida na fatura do mês anterior',
      status: 'aberto',
      prioridade: 'media',
      dataAbertura: '2024-01-15',
      tempoResposta: '45min',
      categoria: 'Financeiro',
      icone: '💰'
    },
    {
      id: '3',
      numero: '#10236',
      cliente: 'Carlos Santos',
      descricao: 'Solicitação de cancelamento do serviço',
      status: 'em-andamento',
      prioridade: 'baixa',
      dataAbertura: '2024-01-14',
      tempoResposta: '1h 15min',
      categoria: 'Comercial',
      icone: '📞'
    },
    {
      id: '4',
      numero: '#10237',
      cliente: 'Ana Costa',
      descricao: 'Dúvida sobre faturamento e planos disponíveis',
      status: 'aberto',
      prioridade: 'baixa',
      dataAbertura: '2024-01-14',
      tempoResposta: '30min',
      categoria: 'Suporte',
      icone: '❓'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService // Injeta o AuthService
  ) {
    // Verificar se o usuário está logado
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return;
    }

    // Obter dados do usuário logado
    this.usuarioLogado = this.authService.getUsuarioLogado();
  }

  // Método de logout
  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      // O redirecionamento é feito automaticamente pelo AuthService
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'aberto':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'em-andamento':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'fechado':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-500';
      case 'media':
        return 'bg-yellow-500';
      case 'baixa':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em-andamento':
        return 'Em andamento';
      case 'fechado':
        return 'Fechado';
      default:
        return 'Desconhecido';
    }
  }

  getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }
}

