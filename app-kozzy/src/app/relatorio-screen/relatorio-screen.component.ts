import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';

@Component({
  selector: 'app-relatorio-screen',
  standalone: true,
  imports: [CommonModule, RelatorioTabelaComponent],
  templateUrl: './relatorio-screen.component.html',
  styleUrls: ['./relatorio-screen.component.css']
})
export class RelatorioScreenComponent {
  @Input() chamados: Chamado[] = [];
  @Output() openFilterModal = new EventEmitter<void>();
  @Output() closeReportScreen = new EventEmitter<void>();

  constructor() { }
}
