import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
  private readonly STORAGE_KEY = 'kozzy_chamados';
  private readonly PROTOCOLS_KEY = 'kozzy_protocolos_existentes';
  
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  // Dados iniciais de exemplo
  private dadosIniciais: Chamado[] = [
    {
      id: '1',
      numeroProtocolo: '10234',
      cliente: '👤 João da Silva',
      descricao: 'Problema de conexão com a internet, cliente relatando lentidão',
      status: 'em-andamento',
      prioridade: 'alta',
      dataAbertura: '2024-01-15',
      horaAbertura: '14:30',
      tempoResposta: '2h 30min',
      categoria: 'Técnico',
      atendente: 'Mariana Silva',
      icone: '🔧',
      dataHoraCriacao: '2024-01-15T14:30:00.000Z'
    },
    {
      id: '2',
      numeroProtocolo: '10235',
      cliente: '👤 Maria Oliveira',
      descricao: 'Cobrança indevida na fatura do mês anterior',
      status: 'aberto',
      prioridade: 'media',
      dataAbertura: '2024-01-15',
      horaAbertura: '15:15',
      tempoResposta: '45min',
      categoria: 'Financeiro',
      atendente: 'Fernanda Costa',
      icone: '💰',
      dataHoraCriacao: '2024-01-15T15:15:00.000Z'
    },
    {
      id: '3',
      numeroProtocolo: '10236',
      cliente: '🚴 Carlos Santos',
      descricao: 'Solicitação de cancelamento do serviço',
      status: 'em-andamento',
      prioridade: 'baixa',
      dataAbertura: '2024-01-14',
      horaAbertura: '09:45',
      tempoResposta: '1h 15min',
      categoria: 'Comercial',
      atendente: 'Carla Santos',
      icone: '📞',
      dataHoraCriacao: '2024-01-14T09:45:00.000Z'
    },
    {
      id: '4',
      numeroProtocolo: '10237',
      cliente: '👤 Ana Costa',
      descricao: 'Dúvida sobre faturamento e planos disponíveis',
      status: 'aberto',
      prioridade: 'baixa',
      dataAbertura: '2024-01-14',
      horaAbertura: '16:20',
      tempoResposta: '30min',
      categoria: 'Suporte',
      atendente: 'Rafael Oliveira',
      icone: '❓',
      dataHoraCriacao: '2024-01-14T16:20:00.000Z'
    },
    {
      id: '5',
      numeroProtocolo: '10238',
      cliente: '🏪 Pedro Almeida',
      descricao: 'Instalação de novo equipamento',
      status: 'fechado',
      prioridade: 'media',
      dataAbertura: '2024-01-13',
      horaAbertura: '10:00',
      tempoResposta: '3h 20min',
      categoria: 'Técnico',
      atendente: 'Mariana Silva',
      icone: '🔧',
      dataHoraCriacao: '2024-01-13T10:00:00.000Z'
    },
    {
      id: '6',
      numeroProtocolo: '10239',
      cliente: '👤 Lucia Ferreira',
      descricao: 'Troca de plano de internet',
      status: 'fechado',
      prioridade: 'baixa',
      dataAbertura: '2024-01-12',
      horaAbertura: '11:30',
      tempoResposta: '1h 45min',
      categoria: 'Comercial',
      atendente: 'Fernanda Costa',
      icone: '📞',
      dataHoraCriacao: '2024-01-12T11:30:00.000Z'
    },
    {
      id: '7',
      numeroProtocolo: '10240',
      cliente: '🚴 Roberto Silva',
      descricao: 'Problema com roteador Wi-Fi',
      status: 'aberto',
      prioridade: 'urgente',
      dataAbertura: '2024-01-16',
      horaAbertura: '08:45',
      tempoResposta: '1h 10min',
      categoria: 'Técnico',
      atendente: 'Carla Santos',
      icone: '🔧',
      dataHoraCriacao: '2024-01-16T08:45:00.000Z'
    },
    {
      id: '8',
      numeroProtocolo: '10241',
      cliente: '👤 Fernanda Costa',
      descricao: 'Solicitação de segunda via de boleto',
      status: 'em-andamento',
      prioridade: 'baixa',
      dataAbertura: '2024-01-16',
      horaAbertura: '13:35',
      tempoResposta: '25min',
      categoria: 'Financeiro',
      atendente: 'Rafael Oliveira',
      icone: '💰',
      dataHoraCriacao: '2024-01-16T13:35:00.000Z'
    }
  ];

  constructor() {
    this.inicializarDados();
  }

  // Inicializar dados do localStorage ou usar dados padrão
  private inicializarDados(): void {
    try {
      const chamadosSalvos = localStorage.getItem(this.STORAGE_KEY);
      
      if (chamadosSalvos) {
        const chamados = JSON.parse(chamadosSalvos);
        this.chamadosSubject.next(chamados);
        console.log('✅ Chamados carregados do localStorage:', chamados.length);
      } else {
        // Primeira vez - usar dados iniciais
        this.salvarChamados(this.dadosIniciais);
        this.inicializarProtocolosExistentes();
        console.log('✅ Dados iniciais carregados:', this.dadosIniciais.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
      this.chamadosSubject.next(this.dadosIniciais);
    }
  }

  // Inicializar lista de protocolos existentes
  private inicializarProtocolosExistentes(): void {
    const protocolos = this.dadosIniciais.map(c => c.numeroProtocolo);
    localStorage.setItem(this.PROTOCOLS_KEY, JSON.stringify(protocolos));
  }

  // Obter todos os chamados
  getChamados(): Observable<Chamado[]> {
    return this.chamados$;
  }

  // Obter chamados de forma síncrona
  getChamadosSync(): Chamado[] {
    return this.chamadosSubject.value;
  }

  // Adicionar novo chamado
  adicionarChamado(novoChamado: NovoChamado): Chamado {
    const chamados = this.getChamadosSync();
    
    // Converter para formato interno
    const chamadoInterno: Chamado = {
      id: this.gerarNovoId(),
      numeroProtocolo: novoChamado.numeroProtocolo,
      cliente: this.formatClienteLabel(novoChamado.cliente),
      descricao: novoChamado.descricao || 'Sem descrição adicional',
      status: 'aberto',
      prioridade: this.mapPrioridadeValue(novoChamado.prioridade),
      dataAbertura: novoChamado.data,
      horaAbertura: novoChamado.hora,
      tempoResposta: '0min',
      categoria: this.mapAssuntoToCategoria(novoChamado.assunto),
      atendente: this.formatAtendenteLabel(novoChamado.atendente),
      icone: this.getIconeByCategoria(this.mapAssuntoToCategoria(novoChamado.assunto)),
      isNovo: true,
      dataHoraCriacao: novoChamado.dataHoraCriacao
    };

    // Adicionar ao início da lista
    const novosChamados = [chamadoInterno, ...chamados];
    
    // Salvar no localStorage
    this.salvarChamados(novosChamados);
    
    // Adicionar protocolo à lista de existentes
    this.adicionarProtocoloExistente(novoChamado.numeroProtocolo);
    
    // Remover destaque "novo" após 5 segundos
    setTimeout(() => {
      this.removerDestaqueNovo(chamadoInterno.id);
    }, 5000);

    console.log(`✅ Chamado #${novoChamado.numeroProtocolo} adicionado e salvo`);
    
    return chamadoInterno;
  }

  // Atualizar status de um chamado
  atualizarStatus(id: string, novoStatus: 'aberto' | 'em-andamento' | 'fechado'): void {
    const chamados = this.getChamadosSync();
    const chamado = chamados.find(c => c.id === id);
    
    if (chamado) {
      chamado.status = novoStatus;
      this.salvarChamados(chamados);
      console.log(`✅ Status do chamado #${chamado.numeroProtocolo} atualizado para: ${novoStatus}`);
    }
  }

  // Remover destaque "novo" de um chamado
  private removerDestaqueNovo(id: string): void {
    const chamados = this.getChamadosSync();
    const chamado = chamados.find(c => c.id === id);
    
    if (chamado && chamado.isNovo) {
      chamado.isNovo = false;
      this.salvarChamados(chamados);
    }
  }

  // Obter protocolos existentes
  getProtocolosExistentes(): string[] {
    try {
      const protocolos = localStorage.getItem(this.PROTOCOLS_KEY);
      return protocolos ? JSON.parse(protocolos) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar protocolos existentes:', error);
      return [];
    }
  }

  // Adicionar protocolo à lista de existentes
  private adicionarProtocoloExistente(protocolo: string): void {
    const protocolos = this.getProtocolosExistentes();
    if (!protocolos.includes(protocolo)) {
      protocolos.push(protocolo);
      localStorage.setItem(this.PROTOCOLS_KEY, JSON.stringify(protocolos));
    }
  }

  // Verificar se protocolo já existe
  protocoloExiste(protocolo: string): boolean {
    return this.getProtocolosExistentes().includes(protocolo);
  }

  // Salvar chamados no localStorage
  private salvarChamados(chamados: Chamado[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chamados));
      this.chamadosSubject.next(chamados);
    } catch (error) {
      console.error('❌ Erro ao salvar chamados no localStorage:', error);
    }
  }

  // Gerar novo ID único
  private gerarNovoId(): string {
    const chamados = this.getChamadosSync();
    const maxId = Math.max(...chamados.map(c => parseInt(c.id) || 0));
    return (maxId + 1).toString();
  }

  // Métodos de formatação e mapeamento
  private formatClienteLabel(cliente: string): string {
    if (cliente.includes('👤') || cliente.includes('🚴') || cliente.includes('🏪')) {
      return cliente;
    }
    
    if (cliente.toLowerCase().includes('entregador')) {
      return `🚴 ${cliente.replace(/🚴|👤|🏪/g, '').trim()}`;
    } else if (cliente.toLowerCase().includes('loja') || cliente.toLowerCase().includes('estabelecimento')) {
      return `🏪 ${cliente.replace(/🚴|👤|🏪/g, '').trim()}`;
    } else {
      return `👤 ${cliente.replace(/🚴|👤|🏪/g, '').trim()}`;
    }
  }

  private formatAtendenteLabel(atendente: string): string {
    return atendente.replace(/👩‍💼|👨‍💼/g, '').trim();
  }

  private mapPrioridadeValue(prioridade: string): 'baixa' | 'media' | 'alta' | 'urgente' {
    const prioridadeLower = prioridade.toLowerCase();
    if (prioridadeLower.includes('baixa')) return 'baixa';
    if (prioridadeLower.includes('alta')) return 'alta';
    if (prioridadeLower.includes('urgente')) return 'urgente';
    return 'media';
  }

  private mapAssuntoToCategoria(assunto: string): string {
    const assuntoLower = assunto.toLowerCase();
    if (assuntoLower.includes('técnico') || assuntoLower.includes('tecnico')) return 'Técnico';
    if (assuntoLower.includes('entrega')) return 'Entrega';
    if (assuntoLower.includes('pagamento') || assuntoLower.includes('financeiro')) return 'Financeiro';
    if (assuntoLower.includes('cadastro')) return 'Cadastro';
    if (assuntoLower.includes('comercial') || assuntoLower.includes('vendas')) return 'Comercial';
    if (assuntoLower.includes('suporte')) return 'Suporte';
    return 'Geral';
  }

  private getIconeByCategoria(categoria: string): string {
    switch (categoria) {
      case 'Técnico': return '🔧';
      case 'Entrega': return '📦';
      case 'Financeiro': return '💰';
      case 'Cadastro': return '📝';
      case 'Comercial': return '📞';
      case 'Suporte': return '❓';
      default: return '📋';
    }
  }

  // Métodos utilitários para exportação e limpeza
  exportarDados(): string {
    const chamados = this.getChamadosSync();
    return JSON.stringify(chamados, null, 2);
  }

  limparTodosDados(): void {
    if (confirm('⚠️ Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.PROTOCOLS_KEY);
      this.inicializarDados();
      console.log('🗑️ Todos os dados foram limpos e reinicializados');
    }
  }

  // Buscar chamados por cliente
  buscarChamadosPorCliente(termoCliente: string): Chamado[] {
    const chamados = this.getChamadosSync();
    const termoBusca = termoCliente.toLowerCase();
    return chamados.filter(chamado =>
      chamado.cliente.toLowerCase().includes(termoBusca)
    );
  }

  // Buscar chamados por filtros de relatório
  buscarChamadosPorFiltros(filtros: any): Chamado[] {
    const chamados = this.getChamadosSync();
    let resultado = [...chamados];

    // Filtrar por período (obrigatório)
    if (filtros.dataInicio && filtros.dataFim) {
      resultado = resultado.filter(chamado => {
        const dataAbertura = new Date(chamado.dataAbertura);
        const dataInicio = new Date(filtros.dataInicio);
        const dataFim = new Date(filtros.dataFim);
        return dataAbertura >= dataInicio && dataAbertura <= dataFim;
      });
    }

    // Filtrar por status (opcional)
    if (filtros.status && filtros.status !== '') {
      resultado = resultado.filter(chamado => chamado.status === filtros.status);
    }

    // Filtrar por prioridade (opcional)
    if (filtros.prioridade && filtros.prioridade !== '') {
      resultado = resultado.filter(chamado => chamado.prioridade === filtros.prioridade);
    }

    // Filtrar por atendente (opcional)
    if (filtros.atendente && filtros.atendente !== '') {
      resultado = resultado.filter(chamado => 
        chamado.atendente.toLowerCase().includes(filtros.atendente.toLowerCase())
      );
    }

    // Filtrar por cliente (opcional)
    if (filtros.cliente && filtros.cliente !== '') {
      resultado = resultado.filter(chamado => 
        chamado.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())
      );
    }

    return resultado;
  }
}