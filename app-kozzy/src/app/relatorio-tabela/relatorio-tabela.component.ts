import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service'; // Importar a interface Chamado

@Component({
  selector: 'app-relatorio-tabela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-tabela.component.html',
  styleUrls: ['./relatorio-tabela.component.css']
})
export class RelatorioTabelaComponent {
  @Input() chamados: Chamado[] = [];

  constructor() { }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aberto':
        return 'status-aberto';
      case 'em-andamento':
        return 'status-andamento';
      case 'fechado':
        return 'status-fechado';
      default:
        return 'status-default';
    }
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
        return 'Desconhecido';
    }
  }

  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return 'prioridade-urgente';
      case 'alta':
        return 'prioridade-alta';
      case 'media':
        return 'prioridade-media';
      case 'baixa':
        return 'prioridade-baixa';
      default:
        return 'prioridade-media';
    }
  }

  getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return 'Urgente';
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

  getPrioridadeIcon(prioridade: string): string {
    switch (prioridade) {
      case 'urgente':
        return '🔴';
      case 'alta':
        return '🟠';
      case 'media':
        return '🟡';
      case 'baixa':
        return '🟢';
      default:
        return '⚪';
    }
  }

  formatDateTime(dateString: string, timeString: string): string {
    const date = new Date(dateString + 'T' + timeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}


