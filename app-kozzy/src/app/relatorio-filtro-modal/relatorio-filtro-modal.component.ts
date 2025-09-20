import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

export interface RelatorioFilters {
  dataInicio: string;
  dataFim: string;
  status?: 'aberto' | 'em-andamento' | 'fechado';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  atendente?: string;
  cliente?: string;
}

@Component({
  selector: 'app-relatorio-filtro-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './relatorio-filtro-modal.component.html',
  styleUrls: ['./relatorio-filtro-modal.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-30px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class RelatorioFiltroModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() gerarRelatorioEvent = new EventEmitter<RelatorioFilters>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm();
    console.log('RelatorioFiltrosModalComponent inicializado!');
  }

  initializeForm(): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.filterForm = this.fb.group({
      dataInicio: [today, Validators.required],
      dataFim: [today, Validators.required],
      status: [''],
      prioridade: [''],
      atendente: [''],
      cliente: ['']
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  closeModalHandler(): void {
    this.closeModal.emit();
    this.filterForm.reset();
    this.initializeForm(); // Resetar para valores padrão
  }

  gerarRelatorio(): void {
    if (this.filterForm.valid) {
      this.gerarRelatorioEvent.emit(this.filterForm.value);
      this.closeModalHandler();
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  markAllFieldsAsTouched() {
    Object.keys(this.filterForm.controls).forEach(key => {
      this.filterForm.get(key)?.markAsTouched();
    });
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.filterForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.filterForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
    }
    return '';
  }
}


