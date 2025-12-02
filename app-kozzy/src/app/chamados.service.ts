import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Interface do Front (Modal)
export interface NovoChamado {
  numeroProtocolo?: string;
  cliente: string;
  area: string;
  assunto: string;
  atendente: string;
  prioridade: string;
  status: string;
  descricao: string;
  data: string;
  hora: string;
  dataHoraCriacao: string;
}

// Interface do Front (Lista/Tabela)
export interface Chamado {
  id: string;
  numeroProtocolo: string;
  cliente: string;
  area: string;
  categoria: string;
  atendente: string;
  prioridade: string;
  status: string;
  descricao: string;
  data: string;
  hora: string;
  dataAbertura: string;
  horaAbertura: string;
  
  // --- CAMPOS VISUAIS (Corrigem o erro NG9) ---
  isNovo?: boolean; // Usado para badge "NOVO"
  icone?: string;   // Usado para o ícone do card
}

// Interface de Filtros (Corrigem o erro TS2339)
export interface RelatorioFilters {
  status: string;
  dataInicio: string;
  dataFim: string;
  prioridade: string;
  atendente: string;
  cliente?: string; // <--- Adicionado campo cliente
}

@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
  private readonly API_URL = 'http://localhost:3000/api/atendimentos';
  
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // =================================================================
  // 1. BUSCAR (GET)
  // =================================================================
  getChamados(): Observable<Chamado[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true }).pipe(
      map(listaDoBackend => {
        return listaDoBackend.map(item => {
          // Lógica para definir o ícone baseado na área
          let iconeVisual = '📄';
          const area = item.categoriaAssunto || '';
          if (area.includes('Financeiro')) iconeVisual = '💰';
          else if (area.includes('Entrega')) iconeVisual = '📦';
          else if (area.includes('Técnico')) iconeVisual = '🔧';
          else if (area.includes('Comercial') || area.includes('Vendas')) iconeVisual = '📞';
          else if (area.includes('Pagamento')) iconeVisual = '💳';
          else if (area.includes('Cadastro')) iconeVisual = '📝';
          else if (area.includes('Outros')) iconeVisual = '❓';

          // Lógica para isNovo (ex: criado hoje)
          // Se não tiver data, assume false.
          const isNovoCalculado = false; 

          return {
            id: item._id,
            numeroProtocolo: item.numeroProtocolo,
            cliente: item.tipoCliente,
            area: item.categoriaAssunto,
            categoria: item.categoriaAssunto,
            atendente: 'Atendente', // Ajustaremos quando o back mandar o nome
            prioridade: item.nivelPrioridade,
            status: item.avanco,
            descricao: item.descricaoDetalhada,
            data: item.dataAtendimento ? item.dataAtendimento.split('T')[0] : '',
            hora: item.hora,
            dataAbertura: item.dataAtendimento,
            horaAbertura: item.hora,
            
            // Preenchemos os campos visuais aqui
            icone: iconeVisual,
            isNovo: isNovoCalculado
          };
        });
      }),
      tap(chamadosMapeados => {
        this.chamadosSubject.next(chamadosMapeados);
      })
    );
  }

  // =================================================================
  // 2. CRIAR (POST)
  // =================================================================
  criarChamado(chamado: NovoChamado): Observable<any> {
    const protocolo = chamado.numeroProtocolo || `ATD-${Date.now()}`;

    const payload = {
      numeroProtocolo: protocolo,
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      hora: chamado.hora,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      avanco: 'aberto'
    };

    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  // =================================================================
  // Métodos Auxiliares
  // =================================================================
  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.chamadosSubject.value.find(c => c.numeroProtocolo === protocolo);
  }

  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
      // Filtragem local simples para o relatório
      return this.chamadosSubject.value.filter(c => {
          // Se o filtro existir e for diferente de vazio/todos, aplica a regra
          const matchStatus = !filtros.status || filtros.status === 'todos' || c.status === filtros.status;
          const matchCliente = !filtros.cliente || c.cliente.toLowerCase().includes(filtros.cliente.toLowerCase());
          const matchPrioridade = !filtros.prioridade || filtros.prioridade === 'todas' || c.prioridade === filtros.prioridade;
          
          return matchStatus && matchCliente && matchPrioridade;
      });
  }
  
  adicionarChamado(n: NovoChamado) {
    console.warn('ERRO: Use criarChamado() para salvar no banco.');
  }
  
  atualizarChamado(c: Chamado) {
    console.warn('ERRO: Atualização ainda não implementada no back.');
  }
}