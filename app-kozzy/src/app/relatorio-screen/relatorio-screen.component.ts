import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';
import * as XLSX from 'xlsx'; // 1. IMPORTE A BIBLIOTECA XLSX
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

    // Mapeia e renomeia as colunas para a planilha
    const dadosParaPlanilha = this.chamados.map(chamado => ({
      'Protocolo': chamado.numeroProtocolo,
      'Cliente': chamado.cliente.replace(/🚴|👤|🏪/g, '').trim(), // Remove ícones
      'Status': this.getStatusLabel(chamado.status),
      'Data': chamado.dataAbertura,
      'Hora': chamado.horaAbertura,
      'Prioridade': this.getPrioridadeLabel(chamado.prioridade),
      'Atendente': chamado.atendente,
      'Categoria': chamado.categoria,
      'Descrição': chamado.descricao
    }));

    // Cria a planilha a partir do array de objetos
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

    // Ajusta a largura das colunas (opcional, mas melhora a aparência)
const objectMaxLength: number[] = [];
    for (let i = 0; i < dadosParaPlanilha.length; i++) {
      let value = Object.values(dadosParaPlanilha[i]);
      for (let j = 0; j < value.length; j++) {
        if (typeof value[j] == "number") {
          objectMaxLength[j] = 10;
        } else if (typeof value[j] == "string") {
          objectMaxLength[j] = Math.max(objectMaxLength[j] || 0, value[j].length);
        }
      }
    }
    ws['!cols'] = objectMaxLength.map(w => ({ width: w + 2 }));


    // Cria o "livro" do Excel e adiciona a planilha
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');

    // Gera o arquivo e inicia o download
    XLSX.writeFile(wb, `Relatorio_Chamados_${new Date().toISOString().split('T')[0]}.xlsx`);
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

