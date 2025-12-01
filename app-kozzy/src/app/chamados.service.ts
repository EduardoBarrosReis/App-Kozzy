import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
  categoria: string; // Refere-se ao Assunto
  area: string;      // Refere-se ao Departamento (Novo)
  atendente: string;
  icone: string;
  isNovo?: boolean;
  dataHoraCriacao: string;
}

export interface NovoChamado {
  numeroProtocolo?: string;
  cliente: string;
  area: string;      // Novo
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

  private dadosIniciais: Chamado[] = [];

  constructor(private authService: AuthService) {
    this.inicializarDados();
  }

  private inicializarDados(): void {
    try {
      const chamadosSalvos = localStorage.getItem(this.STORAGE_KEY);
      if (!chamadosSalvos) {
         this.chamadosSubject.next(this.dadosIniciais);
      } else {
         this.chamadosSubject.next(JSON.parse(chamadosSalvos));
      }
    } catch (e) { console.error(e); }
  }

  getChamadosSync(): Chamado[] {
    return this.chamadosSubject.value;
  }

  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.getChamadosSync().find(c => c.numeroProtocolo === protocolo);
  }

  adicionarChamado(novoChamado: NovoChamado): Chamado {
    const chamados = this.getChamadosSync();
    
    const protocoloFinal = novoChamado.numeroProtocolo 
      ? novoChamado.numeroProtocolo 
      : Math.floor(10000 + Math.random() * 90000).toString();

    // Define ícone baseado na ÁREA (Departamento)
    const iconeFormatado = this.getIconeByArea(novoChamado.area);

    const chamadoInterno: Chamado = {
      id: this.gerarNovoId(),
      numeroProtocolo: protocoloFinal,
      cliente: novoChamado.cliente,
      descricao: novoChamado.descricao || 'Sem descrição adicional',
      status: 'aberto',
      prioridade: novoChamado.prioridade as any,
      dataAbertura: novoChamado.data,
      horaAbertura: novoChamado.hora,
      tempoResposta: '0min',
      categoria: novoChamado.assunto,
      area: novoChamado.area, 
      atendente: novoChamado.atendente,
      icone: iconeFormatado,
      isNovo: true,
      dataHoraCriacao: novoChamado.dataHoraCriacao
    };

    const novosChamados = [chamadoInterno, ...chamados];
    this.salvarChamados(novosChamados);
    this.adicionarProtocoloExistente(protocoloFinal);
    
    return chamadoInterno;
  }

  atualizarChamado(chamadoAtualizado: Chamado): void { 
    const chamados = this.getChamadosSync(); 
    const index = chamados.findIndex(c => c.id === chamadoAtualizado.id); 
    if (index !== -1) { 
      // Atualiza ícone caso a área tenha mudado
      chamadoAtualizado.icone = this.getIconeByArea(chamadoAtualizado.area);
      chamados[index] = chamadoAtualizado; 
      this.salvarChamados(chamados); 
    } 
  }

  private salvarChamados(chamados: Chamado[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chamados));
    this.chamadosSubject.next(chamados);
  }

  // --- Ícones baseados na Área ---
  private getIconeByArea(area: string): string {
    const a = area ? area.toLowerCase() : '';
    if (a.includes('técnico') || a.includes('tecnico')) return '🔧';
    if (a.includes('financeiro')) return '💰';
    if (a.includes('comercial') || a.includes('vendas')) return '📞';
    if (a.includes('entrega') || a.includes('estoque') || a.includes('logística')) return '📦';
    if (a.includes('rh') || a.includes('pessoal')) return '👥';
    if (a.includes('cadastro') || a.includes('dados')) return '📝';
    return '❓';
  }

  private gerarNovoId(): string {
     const chamados = this.getChamadosSync();
     if(chamados.length === 0) return '1';
     const maxId = Math.max(...chamados.map(c => parseInt(c.id) || 0));
     return (maxId + 1).toString();
  }
  
  // Métodos do Protocolo
  getProtocolosExistentes(): string[] {
      const p = localStorage.getItem(this.PROTOCOLS_KEY);
      return p ? JSON.parse(p) : [];
  }
  private adicionarProtocoloExistente(p: string) {
      const lista = this.getProtocolosExistentes();
      lista.push(p);
      localStorage.setItem(this.PROTOCOLS_KEY, JSON.stringify(lista));
  }
  protocoloExiste(p: string): boolean {
      return this.getProtocolosExistentes().includes(p);
  }

  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
      // Retorna todos por enquanto (implemente sua lógica de filtro aqui se tiver)
      return this.getChamadosSync(); 
  }
}