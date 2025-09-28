import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RelatorioFilters } from '../chamados.service';

@Component({
  selector: 'app-relatorio-filtro-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relatorio-filtro-modal.component.html',
  styleUrl: './relatorio-filtro-modal.component.css'
})
export class RelatorioFiltroModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() filtrosSalvos: RelatorioFilters | null = null; // NOVA PROPRIEDADE PARA RECEBER FILTROS SALVOS
  @Output() closeModal = new EventEmitter<void>();
  @Output() gerarRelatorioEvent = new EventEmitter<RelatorioFilters>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      status: [''],
      prioridade: [''],
      atendente: [''],
      cliente: ['']
    });
  }

  ngOnInit(): void {
    // Carregar filtros salvos se existirem
    this.carregarFiltrosSalvos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Quando o modal for aberto ou os filtros salvos mudarem, carregar os valores
    if (changes['isVisible'] && this.isVisible) {
      this.carregarFiltrosSalvos();
    }
    
    if (changes['filtrosSalvos']) {
      this.carregarFiltrosSalvos();
    }
  }

  private carregarFiltrosSalvos(): void {
    if (this.filtrosSalvos) {
      // Preencher o formulário com os filtros salvos
      this.filterForm.patchValue({
        dataInicio: this.filtrosSalvos.dataInicio || '',
        dataFim: this.filtrosSalvos.dataFim || '',
        status: this.filtrosSalvos.status || '',
        prioridade: this.filtrosSalvos.prioridade || '',
        atendente: this.filtrosSalvos.atendente || '',
        cliente: this.filtrosSalvos.cliente || ''
      });
    }
  }

  closeModalHandler(): void {
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  gerarRelatorio(): void {
    if (this.filterForm.valid) {
      const filtros: RelatorioFilters = {
        dataInicio: this.filterForm.value.dataInicio,
        dataFim: this.filterForm.value.dataFim,
        status: this.filterForm.value.status,
        prioridade: this.filterForm.value.prioridade,
        atendente: this.filterForm.value.atendente,
        cliente: this.filterForm.value.cliente
      };

      this.gerarRelatorioEvent.emit(filtros);
    } else {
      // Marcar todos os campos como tocados para mostrar erros de validação
      this.filterForm.markAllAsTouched();
    }
  }

  // Métodos de validação
  hasFieldError(fieldName: string): boolean {
    const field = this.filterForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.filterForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'dataInicio':
            return 'Data de início é obrigatória';
          case 'dataFim':
            return 'Data de fim é obrigatória';
          default:
            return 'Este campo é obrigatório';
        }
      }
    }
    return '';
  }

  // Método para limpar apenas os filtros opcionais (manter as datas)
  limparFiltrosOpcionais(): void {
    this.filterForm.patchValue({
      status: '',
      prioridade: '',
      atendente: '',
      cliente: ''
    });
  }

  // Método para limpar todos os filtros
  limparTodosFiltros(): void {
    this.filterForm.reset();
  }
}

