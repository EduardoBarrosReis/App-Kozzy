import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs'; // Adicionei 'tap'
import { map } from 'rxjs/operators';

// Interfaces
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
  dataAbertura: string;
  horaAbertura: string;
  icone?: string;
  isNovo?: boolean;
}

export interface RelatorioFilters {
  status: string;
  dataInicio: string;
  dataFim: string;
  prioridade: string;
  atendente: string;
  cliente?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChamadosService {
  private readonly API_URL = 'http://localhost:3000/api/atendimentos';
  
  private chamadosSubject = new BehaviorSubject<Chamado[]>([]);
  public chamados$ = this.chamadosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 1. GET (Listar)
  getChamados(): Observable<Chamado[]> {
    return this.http.get<any[]>(this.API_URL, { withCredentials: true }).pipe(
      map(listaDoBackend => {
        return listaDoBackend.map(item => {
          // Lógica de Ícone
          let iconeVisual = '📄';
          let nomeAtendente = 'Sistema';
          const area = item.categoriaAssunto || '';
          if (item.criadoPor && typeof item.criadoPor === 'object' && item.criadoPor.nomeCompleto) {
             nomeAtendente = item.criadoPor.nomeCompleto;
          } 
          // CASO 2: O Back-end mandou só o ID (Antigo/Erro)
          else if (item.criadoPor && typeof item.criadoPor === 'string') {
             // Mostra um pedaço do ID para não ficar vazio
             nomeAtendente = 'ID: ' + item.criadoPor.substring(0, 5) + '...';
          }
          if (area.includes('Financeiro')) iconeVisual = '💰';
          else if (area.includes('Entrega') || area.includes('Estoque')) iconeVisual = '📦';
          else if (area.includes('Técnico')) iconeVisual = '🔧';
          else if (area.includes('Comercial')) iconeVisual = '📞';
          else if (area.includes('RH')) iconeVisual = '👥';
          
          return {
  id: item._id,
  numeroProtocolo: item.numeroProtocolo,
  cliente: item.tipoCliente,
  area: item.categoriaAssunto,
  categoria: item.assuntoEspecifico || item.categoriaAssunto || '', 

            atendente: nomeAtendente,
  
  prioridade: item.nivelPrioridade,
  status: item.avanco,
  descricao: item.descricaoDetalhada,
dataAbertura: item.dataAtendimento ? item.dataAtendimento.split('T')[0] : '',
  horaAbertura: item.hora,
  // ... resto igual
} as Chamado;
        });
      }),
      tap(chamados => this.chamadosSubject.next(chamados))
    );
  }

  // 2. POST (Criar) - CORRIGIDO PARA RETORNAR OBSERVABLE
  adicionarChamado(chamado: NovoChamado): Observable<any> {
    const protocolo = chamado.numeroProtocolo || `ATD-${Date.now()}`;

    const payload = {
      numeroProtocolo: protocolo,
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      hora: chamado.hora,
      dataAtendimento: chamado.data,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      avanco: 'aberto'
    };

    // Retorna o Observable do HTTP
    return this.http.post(this.API_URL, payload, { withCredentials: true });
  }

  // 3. PUT (Atualizar) - CORRIGIDO PARA RETORNAR OBSERVABLE
  atualizarChamado(chamado: Chamado): Observable<any> {
    const payload = {
      tipoCliente: chamado.cliente,
      categoriaAssunto: chamado.area,
      descricaoDetalhada: chamado.descricao,
      nivelPrioridade: chamado.prioridade,
      avanco: chamado.status
    };

    const url = `${this.API_URL}/${chamado.id}`;
    // Retorna o Observable do HTTP
    return this.http.put(url, payload, { withCredentials: true });
  }

  // Métodos Auxiliares
  buscarPorProtocolo(protocolo: string): Chamado | undefined {
    return this.chamadosSubject.value.find(c => c.numeroProtocolo === protocolo);
  }

  buscarChamadosPorFiltros(filtros: RelatorioFilters): Chamado[] {
    return this.chamadosSubject.value; // Simplificado
  }
} 