import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';

@Component({
  selector: 'app-relatorio-screen',
  standalone: true,
  imports: [CommonModule, RelatorioTabelaComponent],
  templateUrl: './relatorio-screen.component.html',
  styleUrl: './relatorio-screen.component.css'
})
export class RelatorioScreenComponent {
  @Input() chamados: Chamado[] = [];
  @Output() openFilterModal = new EventEmitter<void>();
  @Output() closeReportScreen = new EventEmitter<void>();

  getStatusCount(status: string): number {
    return this.chamados.filter(chamado => chamado.status === status).length;
  }

  exportarRelatorio(): void {
    if (!this.chamados || this.chamados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Preparar dados para exportação
    const dadosExportacao = this.chamados.map(chamado => ({
      'Nº Protocolo': chamado.numeroProtocolo,
      'Cliente': chamado.cliente,
      'Status': this.getStatusLabel(chamado.status),
      'Data': chamado.dataAbertura,
      'Hora': chamado.horaAbertura,
      'Prioridade': this.getPrioridadeLabel(chamado.prioridade),
      'Atendente': chamado.atendente,
      'Categoria': chamado.categoria,
      'Descrição': chamado.descricao
    }));

    // Converter para CSV
    const headers = Object.keys(dadosExportacao[0]);
    const csvContent = [
      headers.join(','),
      ...dadosExportacao.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-chamados-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em-andamento':
        return 'Em Andamento';
      case 'fechado':
        return 'Fechado';
      default:
        return status;
    }
  }

  private getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
      case 'baixa':
        return 'Baixa';
      case 'media':
        return 'Média';
      case 'alta':
        return 'Alta';
      case 'urgente':
        return 'Urgente';
      default:
        return prioridade;
    }
  }
}

