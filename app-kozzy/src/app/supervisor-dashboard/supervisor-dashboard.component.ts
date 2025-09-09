import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; // Ajuste o caminho conforme necessário

interface Chamado {
  id: string;
  numero: string;
  cliente: string;
  assunto: string;
  status: 'aberto' | 'em-andamento' | 'concluido';
  prioridade: 'alta' | 'media' | 'baixa';
  atendente: string;
  dataAbertura: Date;
  dataUltimaAtualizacao: Date;
  isNovo?: boolean;
}

interface KPI {
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface FilterOptions {
  busca: string;
  status: string;
  prioridade: string;
  ordenacao: string;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.css']
})
export class SupervisorDashboardComponent implements OnInit {
  
  // Informações do usuário logado
  usuarioLogado: any = null;
  
  // Filtros
  filtros: FilterOptions = {
    busca: '',
    status: 'todos',
    prioridade: 'todas',
    ordenacao: 'mais-recentes'
  };

  // Toast
  toast: ToastMessage = {
    message: '',
    type: 'info',
    visible: false
  };

  // KPIs
  kpis: KPI[] = [
    { label: 'Abertos', value: 0, color: 'red', icon: '🔴' },
    { label: 'Em Andamento', value: 0, color: 'yellow', icon: '🟡' },
    { label: 'Concluídos', value: 0, color: 'green', icon: '✅' },
    { label: 'Urgentes', value: 0, color: 'orange', icon: '⚠️' }
  ];

  // Dados dos chamados
  chamados: Chamado[] = [
    {
      id: '1',
      numero: '#10234',
      cliente: 'João da Silva',
      assunto: 'Problema na entrega',
      status: 'aberto',
      prioridade: 'alta',
      atendente: 'Camila',
      dataAbertura: new Date('2024-01-10'),
      dataUltimaAtualizacao: new Date('2024-01-15'),
      isNovo: true
    },
    {
      id: '2',
      numero: '#10231',
      cliente: 'Maria Oliveira',
      assunto: 'Cobrança indevida',
      status: 'em-andamento',
      prioridade: 'media',
      atendente: 'Eduardo',
      dataAbertura: new Date('2024-01-12'),
      dataUltimaAtualizacao: new Date('2024-01-14')
    },
    {
      id: '3',
      numero: '#10229',
      cliente: 'Fernando Lima',
      assunto: 'Produto com defeito',
      status: 'concluido',
      prioridade: 'baixa',
      atendente: 'Juliana',
      dataAbertura: new Date('2024-01-08'),
      dataUltimaAtualizacao: new Date('2024-01-13')
    },
    {
      id: '4',
      numero: '#10225',
      cliente: 'Ana Costa',
      assunto: 'Cancelamento de pedido',
      status: 'aberto',
      prioridade: 'media',
      atendente: 'Carlos',
      dataAbertura: new Date('2024-01-05'),
      dataUltimaAtualizacao: new Date('2024-01-10')
    },
    {
      id: '5',
      numero: '#10220',
      cliente: 'Pedro Santos',
      assunto: 'Dúvida sobre garantia',
      status: 'aberto',
      prioridade: 'alta',
      atendente: 'Mariana',
      dataAbertura: new Date('2024-01-03'),
      dataUltimaAtualizacao: new Date('2024-01-08')
    },
    {
      id: '6',
      numero: '#10218',
      cliente: 'Lucia Ferreira',
      assunto: 'Troca de produto',
      status: 'em-andamento',
      prioridade: 'baixa',
      atendente: 'Roberto',
      dataAbertura: new Date('2024-01-02'),
      dataUltimaAtualizacao: new Date('2024-01-12')
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService // Injeta o AuthService
  ) {}

  ngOnInit() {
    // Verificar se o usuário está logado e é supervisor
    if (!this.authService.isLogado()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isSupervisor()) {
      this.router.navigate(['/central']);
      return;
    }

    // Obter dados do usuário logado
    this.usuarioLogado = this.authService.getUsuarioLogado();
    
    this.calcularKPIs();
  }

  // Método de logout
  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.showToast('Logout realizado com sucesso!', 'success');
      // O redirecionamento é feito automaticamente pelo AuthService
    }
  }

  // Calcular KPIs baseado nos dados
  calcularKPIs() {
    const abertos = this.chamados.filter(c => c.status === 'aberto').length;
    const emAndamento = this.chamados.filter(c => c.status === 'em-andamento').length;
    const concluidos = this.chamados.filter(c => c.status === 'concluido').length;
    const urgentes = this.chamados.filter(c => c.prioridade === 'alta').length;

    this.kpis[0].value = abertos;
    this.kpis[1].value = emAndamento;
    this.kpis[2].value = concluidos;
    this.kpis[3].value = urgentes;
  }

  // Filtrar chamados
  getChamadosFiltrados(): Chamado[] {
    let resultado = [...this.chamados];

    // Filtro de busca
    if (this.filtros.busca.trim()) {
      const busca = this.filtros.busca.toLowerCase();
      resultado = resultado.filter(c => 
        c.numero.toLowerCase().includes(busca) ||
        c.cliente.toLowerCase().includes(busca) ||
        c.assunto.toLowerCase().includes(busca)
      );
    }

    // Filtro de status
    if (this.filtros.status !== 'todos') {
      resultado = resultado.filter(c => c.status === this.filtros.status);
    }

    // Filtro de prioridade
    if (this.filtros.prioridade !== 'todas') {
      resultado = resultado.filter(c => c.prioridade === this.filtros.prioridade);
    }

    // Ordenação
    switch (this.filtros.ordenacao) {
      case 'mais-recentes':
        resultado.sort((a, b) => b.dataUltimaAtualizacao.getTime() - a.dataUltimaAtualizacao.getTime());
        break;
      case 'mais-antigos':
        resultado.sort((a, b) => a.dataAbertura.getTime() - b.dataAbertura.getTime());
        break;
      case 'por-prioridade':
        const prioridadeOrder = { 'alta': 3, 'media': 2, 'baixa': 1 };
        resultado.sort((a, b) => prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]);
        break;
    }

    return resultado;
  }

  // Obter chamados em aberto mais antigos
  getChamadosAbertosMaisAntigos(): Chamado[] {
    return this.chamados
      .filter(c => c.status === 'aberto')
      .sort((a, b) => a.dataAbertura.getTime() - b.dataAbertura.getTime())
      .slice(0, 5);
  }

  // Limpar filtros
  limparFiltros() {
    this.filtros = {
      busca: '',
      status: 'todos',
      prioridade: 'todas',
      ordenacao: 'mais-recentes'
    };
    this.showToast('Filtros limpos com sucesso', 'info');
  }

  // Abrir detalhes do chamado
  abrirChamado(chamado: Chamado) {
    this.showToast(`Abrindo chamado ${chamado.numero} - ${chamado.cliente}`, 'info');
    // Aqui você implementaria a navegação para os detalhes do chamado
    // this.router.navigate(['/chamado', chamado.id]);
  }

  // Destacar chamado na tabela
  destacarChamado(chamado: Chamado) {
    this.showToast(`Chamado ${chamado.numero} destacado na tabela`, 'success');
    // Implementar lógica para destacar o chamado na tabela principal
  }

  // Obter classe CSS para status
  getStatusClass(status: string): string {
    switch (status) {
      case 'aberto':
        return 'status-aberto';
      case 'em-andamento':
        return 'status-em-andamento';
      case 'concluido':
        return 'status-concluido';
      default:
        return 'status-default';
    }
  }

  // Obter classe CSS para prioridade
  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'alta':
        return 'prioridade-alta';
      case 'media':
        return 'prioridade-media';
      case 'baixa':
        return 'prioridade-baixa';
      default:
        return 'prioridade-default';
    }
  }

  // Obter label do status
  getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em-andamento':
        return 'Em andamento';
      case 'concluido':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  }

  // Obter label da prioridade
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

  // Formatar data
  formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  // Calcular dias em aberto
  calcularDiasEmAberto(dataAbertura: Date): number {
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataAbertura.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Mostrar toast
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

  // Verificar se é mobile
  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}

