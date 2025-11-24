import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service'; // A importação continua necessária

export interface Chamado {
  id: string;
  numeroProtocolo: string;
  cliente: string;
  descricao: string;
  status: 'aberto' | 'em-andamento' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataAbertura: string;
  horaAbertura: string;
  tempoResposta: string;
  categoria: string;
  atendente: string;
  icone: string;
  isNovo?: boolean;
  dataHoraCriacao: string;
}

export interface NovoChamado {
  numeroProtocolo: string;
  cliente: string;
  assunto: string;
  atendente: string;
  data: string;
  hora: string;
  prioridade: string;
  descricao: string;
  status: 'aberto';
  dataHoraCriacao: string;
}

export interface RelatorioFilters {
  dataInicio: string;
  dataFim: string;
  status?: 'aberto' | 'em-andamento' | 'fechado' | '';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente' | '';
  atendente?: string;
  cliente?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
  private readonly STORAGE_KEY = 'kozzy_chamados';
  private readonly PROTOCOLS_KEY = 'kozzy_protocolos_existentes';
  
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  // Dados iniciais de exemplo (Fonte da verdade)
  private dadosIniciais: Chamado[] = [
  { 
    id: '1', 
    numeroProtocolo: '10234', 
    cliente: '👤 Cliente Final', // Padrão Cliente Final
    descricao: 'Problema de conexão com a internet, cliente relatando lentidão', 
    status: 'em-andamento', 
    prioridade: 'alta', 
    dataAbertura: '2025-11-20', // Data Atualizada
    horaAbertura: '14:30', 
    tempoResposta: '2h 30min', 
    categoria: '🔧 Suporte Técnico', 
    atendente: 'Mariana Silva', 
    icone: '🔧', 
    dataHoraCriacao: '2025-11-20T14:30:00.000Z' 
  },
  { 
    id: '2', 
    numeroProtocolo: '10235', 
    cliente: '👤 Cliente Final', // Padrão Cliente Final
    descricao: 'Cobrança indevida na fatura do mês anterior', 
    status: 'aberto', 
    prioridade: 'media', 
    dataAbertura: '2025-11-20', // Data Atualizada
    horaAbertura: '15:15', 
    tempoResposta: '45min', 
    categoria: '💰 Financeiro', 
    atendente: 'Fernanda Costa', 
    icone: '💰', 
    dataHoraCriacao: '2025-11-20T15:15:00.000Z' 
  },
  { 
    id: '3', 
    numeroProtocolo: '10236', 
    cliente: '🚴 Entregador', // Padrão Entregador
    descricao: 'Solicitação de cancelamento do serviço', 
    status: 'em-andamento', 
    prioridade: 'baixa', 
    dataAbertura: '2025-11-21', // Data Atualizada
    horaAbertura: '09:45', 
    tempoResposta: '1h 15min', 
    categoria: '📞 Comercial/Vendas', 
    atendente: 'Carla Santos', 
    icone: '📞', 
    dataHoraCriacao: '2025-11-21T09:45:00.000Z' 
  },
  { 
    id: '4', 
    numeroProtocolo: '10237', 
    cliente: '👤 Cliente Final', // Padrão Cliente Final
    descricao: 'Dúvida sobre faturamento e planos disponíveis', 
    status: 'aberto', 
    prioridade: 'baixa', 
    dataAbertura: '2025-11-21', // Data Atualizada
    horaAbertura: '16:20', 
    tempoResposta: '30min', 
    categoria: '❓ Suporte', 
    atendente: 'Rafael Oliveira', 
    icone: '❓', 
    dataHoraCriacao: '2025-11-21T16:20:00.000Z' 
  },
  { 
    id: '5', 
    numeroProtocolo: '10238', 
    cliente: '🏪 Loja/Estabelecimento', // Padrão Loja
    descricao: 'Instalação de novo equipamento', 
    status: 'fechado', 
    prioridade: 'media', 
    dataAbertura: '2025-11-22', // Data Atualizada
    horaAbertura: '10:00', 
    tempoResposta: '3h 20min', 
    categoria: '🔧 Suporte Técnico', 
    atendente: 'Mariana Silva', 
    icone: '🔧', 
    dataHoraCriacao: '2025-11-22T10:00:00.000Z' 
  },
  { 
    id: '6', 
    numeroProtocolo: '10239', 
    cliente: '👤 Cliente Final', // Padrão Cliente Final
    descricao: 'Troca de plano de internet', 
    status: 'fechado', 
    prioridade: 'baixa', 
    dataAbertura: '2025-11-22', // Data Atualizada
    horaAbertura: '11:30', 
    tempoResposta: '1h 45min', 
    categoria: '📞 Comercial/Vendas', 
    atendente: 'Fernanda Costa', 
    icone: '📞', 
    dataHoraCriacao: '2025-11-22T11:30:00.000Z' 
  },
  { 
    id: '7', 
    numeroProtocolo: '10240', 
    cliente: '🚴 Entregador', // Padrão Entregador
    descricao: 'Problema com roteador Wi-Fi', 
    status: 'aberto', 
    prioridade: 'urgente', 
    dataAbertura: '2025-11-23', // Data Atualizada
    horaAbertura: '08:45', 
    tempoResposta: '1h 10min', 
    categoria: '🔧 Suporte Técnico', 
    atendente: 'Carla Santos', 
    icone: '🔧', 
    dataHoraCriacao: '2025-11-23T08:45:00.000Z' 
  },
  { 
    id: '8', 
    numeroProtocolo: '10241', 
    cliente: '👤 Cliente Final', // Padrão Cliente Final
    descricao: 'Solicitação de segunda via de boleto', 
    status: 'em-andamento', 
    prioridade: 'baixa', 
    dataAbertura: '2025-11-24', // Data Atualizada
    horaAbertura: '13:35', 
    tempoResposta: '25min', 
    categoria: '💰 Financeiro', 
    atendente: 'Rafael Oliveira', 
    icone: '💰', 
    dataHoraCriacao: '2025-11-24T13:35:00.000Z' 
  }
];


  constructor(private authService: AuthService) {
    this.inicializarDados();
  }

  private inicializarDados(): void {
    try {
      const chamadosSalvos = localStorage.getItem(this.STORAGE_KEY);
      let chamadosParaProcessar: Chamado[];

      if (chamadosSalvos) {
        chamadosParaProcessar = JSON.parse(chamadosSalvos);
      } else {
        chamadosParaProcessar = [...this.dadosIniciais];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chamadosParaProcessar));
        this.inicializarProtocolosExistentes();
      }

      const usuarioLogado = this.authService.getUsuarioLogado();
      let chamadosFinais = chamadosParaProcessar;

      if (usuarioLogado && usuarioLogado.perfil === 'atendente') {
        chamadosFinais = chamadosParaProcessar.map(chamado => ({
          ...chamado,
          atendente: usuarioLogado.nome
        }));
      }

      this.chamadosSubject.next(chamadosFinais);

    } catch (error) {
      console.error('❌ Erro ao inicializar dados dos chamados:', error);
      this.chamadosSubject.next(this.dadosIniciais);
    }
  }
  
  private inicializarProtocolosExistentes(): void {
    const protocolos = this.dadosIniciais.map(c => c.numeroProtocolo);
    localStorage.setItem(this.PROTOCOLS_KEY, JSON.stringify(protocolos));
  }

  getChamados(): Observable<Chamado[]> {
    return this.chamados$;
  }

  getChamadosSync(): Chamado[] {
    return this.chamadosSubject.value;
  }
  
  adicionarChamado(novoChamado: NovoChamado): Chamado {
    const chamados = this.getChamadosSync();
    const chamadoInterno: Chamado = { id: this.gerarNovoId(), numeroProtocolo: novoChamado.numeroProtocolo, cliente: this.formatClienteLabel(novoChamado.cliente), descricao: novoChamado.descricao || 'Sem descrição adicional', status: 'aberto', prioridade: this.mapPrioridadeValue(novoChamado.prioridade), dataAbertura: novoChamado.data, horaAbertura: novoChamado.hora, tempoResposta: '0min', categoria: this.mapAssuntoToCategoria(novoChamado.assunto), atendente: novoChamado.atendente, icone: this.getIconeByCategoria(this.mapAssuntoToCategoria(novoChamado.assunto)), isNovo: true, dataHoraCriacao: novoChamado.dataHoraCriacao };
    const novosChamados = [chamadoInterno, ...chamados];
    this.salvarChamados(novosChamados);
    this.adicionarProtocoloExistente(novoChamado.numeroProtocolo);
    setTimeout(() => { this.removerDestaqueNovo(chamadoInterno.id); }, 5000);
    return chamadoInterno;
  }
  
  atualizarChamado(chamadoAtualizado: Chamado): void { 
    const chamados = this.getChamadosSync(); 
    const index = chamados.findIndex(c => c.id === chamadoAtualizado.id); 
    if (index !== -1) { 
      chamados[index] = chamadoAtualizado; 
      this.salvarChamados(chamados); 
    } 
  }
  
  private salvarChamados(chamados: Chamado[]): void { 
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chamados)); 
    this.chamadosSubject.next(chamados); 
  }
  
  private gerarNovoId(): string { 
    const maxId = Math.max(...this.getChamadosSync().map(c => parseInt(c.id) || 0)); 
    return (maxId + 1).toString(); 
  }
  
  atualizarStatus(id: string, novoStatus: 'aberto' | 'em-andamento' | 'fechado'): void { 
    const chamados = this.getChamadosSync();
    const chamado = chamados.find(c => c.id === id);
    if (chamado) {
      chamado.status = novoStatus;
      this.salvarChamados(chamados);
    }
  }
  
  private removerDestaqueNovo(id: string): void { 
    const chamados = this.getChamadosSync();
    const chamado = chamados.find(c => c.id === id);
    if (chamado && chamado.isNovo) {
      chamado.isNovo = false;
      this.salvarChamados(chamados);
    }
  }
  
  getProtocolosExistentes(): string[] { 
    try { 
      const p = localStorage.getItem(this.PROTOCOLS_KEY); 
      return p ? JSON.parse(p) : []; 
    } catch (e) { 
      return []; 
    } 
  }
  
  private adicionarProtocoloExistente(protocolo: string): void { 
    const p = this.getProtocolosExistentes(); 
    if (!p.includes(protocolo)) { 
      p.push(protocolo); 
      localStorage.setItem(this.PROTOCOLS_KEY, JSON.stringify(p)); 
    } 
  }
  
  protocoloExiste(protocolo: string): boolean { 
    return this.getProtocolosExistentes().includes(protocolo); 
  }
  
  private formatClienteLabel(cliente: string): string { return cliente; }
  private formatAtendenteLabel(atendente: string): string { return atendente.replace(/👩‍💼|👨‍💼/g, '').trim(); }
  private mapPrioridadeValue(prioridade: string): 'baixa' | 'media' | 'alta' | 'urgente' { return prioridade as any; }
  private mapAssuntoToCategoria(assunto: string): string { return 'Geral'; }
  private getIconeByCategoria(categoria: string): string { return '📋'; }
  
  exportarDados(): string { 
    return JSON.stringify(this.getChamadosSync(), null, 2); 
  }
  
  limparTodosDados(): void { 
    if (confirm('⚠️ Tem certeza?')) { 
      localStorage.removeItem(this.STORAGE_KEY); 
      localStorage.removeItem(this.PROTOCOLS_KEY); 
      this.inicializarDados(); 
    } 
  }
  
  buscarChamadosPorCliente(termo: string): Chamado[] { 
    const t = termo.toLowerCase(); 
    return this.getChamadosSync().filter(c => c.cliente.toLowerCase().includes(t)); 
  }

  // MÉTODO buscarChamadosPorFiltros CORRIGIDO
  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
    const chamados = this.getChamadosSync();
    let resultado = [...chamados];

    // Filtrar por período (obrigatório)
    if (filtros.dataInicio && filtros.dataFim) {
      // CORREÇÃO: Ajusta a data de início para o começo do dia e a data de fim para o final do dia.
      const dataInicio = new Date(filtros.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);

      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);

      resultado = resultado.filter(chamado => {
        // Ignora a hora do chamado e compara apenas as datas
        const dataAbertura = new Date(chamado.dataAbertura);
        dataAbertura.setHours(0, 0, 0, 0); // Zera a hora para comparação
        return dataAbertura >= dataInicio && dataAbertura <= dataFim;
      });
    }

    // Filtrar por status (opcional)
    if (filtros.status) {
      resultado = resultado.filter(chamado => chamado.status === filtros.status);
    }

    // Filtrar por prioridade (opcional)
    if (filtros.prioridade) {
      resultado = resultado.filter(chamado => chamado.prioridade === filtros.prioridade);
    }

    // Filtrar por atendente (opcional)
    if (filtros.atendente) {
      resultado = resultado.filter(chamado => 
        chamado.atendente.toLowerCase().includes(filtros.atendente!.toLowerCase())
      );
    }

    // Filtrar por cliente (opcional)
    if (filtros.cliente) {
      resultado = resultado.filter(chamado => 
        chamado.cliente.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

    return resultado;
  }
}