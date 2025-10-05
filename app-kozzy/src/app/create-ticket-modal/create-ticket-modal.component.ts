import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChamadosService, Chamado, NovoChamado } from '../chamados.service'; // Ajuste o caminho conforme necessário

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
}

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-30px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class CreateTicketModalComponent implements OnInit, OnChanges {
  // --- INPUTS & OUTPUTS ---
  @Input() isVisible: boolean = false;
  @Input() chamadoParaEditar?: Chamado | null;
  @Input() perfilUsuario: 'supervisor' | 'atendente' = 'atendente';
  @Input() usuarioLogadoNome: string = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  // --- PROPRIEDADES DE CONTROLE ---
  ticketForm!: FormGroup;
  isLoading = false;
  showPreview = false;
  isEditMode = false;

  toast: ToastMessage = { message: '', type: 'info', visible: false };

  // Opções para os selects
  clienteOptions: SelectOption[] = [
    { value: 'entregador', label: '🚴 Entregador', icon: '🚴' },
    { value: 'cliente', label: '👤 Cliente Final', icon: '👤' },
    { value: 'loja', label: '🏪 Loja/Estabelecimento', icon: '🏪' }
  ];
  assuntoOptions: SelectOption[] = [
    { value: 'tecnico', label: '🔧 Suporte Técnico', icon: '🔧' },
    { value: 'entrega', label: '📦 Problemas de Entrega', icon: '📦' },
    { value: 'pagamento', label: '💳 Questões de Pagamento', icon: '💳' },
    { value: 'cadastro', label: '📝 Cadastro/Dados', icon: '📝' },
    { value: 'comercial', label: '💼 Comercial/Vendas', icon: '💼' },
    { value: 'financeiro', label: '💰 Financeiro', icon: '💰' },
    { value: 'outros', label: '❓ Outros Assuntos', icon: '❓' }
  ];
  atendenteOptions: SelectOption[] = [
    { value: 'mariana', label: '👩‍💼 Mariana Silva', icon: '👩‍💼' },
    { value: 'fernanda', label: '👩‍💼 Fernanda Costa', icon: '👩‍💼' },
    { value: 'carla', label: '👩‍💼 Carla Santos', icon: '👩‍💼' },
    { value: 'rafael', label: '👨‍💼 Rafael Oliveira', icon: '👨‍💼' }
  ];
  prioridadeOptions: SelectOption[] = [
    { value: 'baixa', label: '🟢 Baixa Prioridade', icon: '🟢' },
    { value: 'media', label: '🟡 Média Prioridade', icon: '🟡' },
    { value: 'alta', label: '🟠 Alta Prioridade', icon: '🟠' },
    { value: 'urgente', label: '🔴 Urgente', icon: '🔴' }
  ];  

  constructor(
    private fb: FormBuilder,
    private chamadosService: ChamadosService,
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isVisible) {
      if (this.chamadoParaEditar) {
        this.isEditMode = true;
        this.populateFormForEdit();
        this.ticketForm.get('numeroProtocolo')?.disable();
      } else {
        this.isEditMode = false;
        this.initializeForm();
        this.ticketForm.get('numeroProtocolo')?.enable();
      }
    }
  }

  initializeForm() {
    const now = new Date();
    this.ticketForm = this.fb.group({
      numeroProtocolo: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), this.protocolValidator.bind(this)]],
      cliente: ['', Validators.required],
      assunto: ['', Validators.required],
      // O campo atendente ainda existe no form, mas será escondido no HTML para o modo de criação
      atendente: ['', this.isEditMode ? Validators.required : []], 
      data: [{ value: now.toISOString().split('T')[0], disabled: true }, Validators.required],
      hora: [{ value: now.toTimeString().slice(0, 5), disabled: true }, Validators.required],
      prioridade: ['media'],
      descricao: ['', Validators.maxLength(500)]
    });
  }

  populateFormForEdit(): void {
    if (!this.chamadoParaEditar) return;

    const clienteValue = this.clienteOptions.find(opt => this.chamadoParaEditar!.cliente.includes(opt.label))?.value || '';
    const assuntoValue = this.assuntoOptions.find(opt => opt.label === this.chamadoParaEditar!.categoria)?.value || '';
    const atendenteValue = this.atendenteOptions.find(opt => opt.label.includes(this.chamadoParaEditar!.atendente))?.value || '';
    const prioridadeValue = this.prioridadeOptions.find(opt => opt.label.includes(this.getPrioridadeLabel(this.chamadoParaEditar!.prioridade as any)))?.value || 'media';

    this.ticketForm.patchValue({
      numeroProtocolo: this.chamadoParaEditar.numeroProtocolo,
      cliente: clienteValue,
      assunto: assuntoValue,
      atendente: atendenteValue,
      data: this.chamadoParaEditar.dataAbertura,
      hora: this.chamadoParaEditar.horaAbertura,
      prioridade: prioridadeValue,
      descricao: this.chamadoParaEditar.descricao
    });
  }
  
  closeModalHandler() {
    this.closeModal.emit();
    setTimeout(() => {
      this.isEditMode = false;
      this.chamadoParaEditar = null;
      this.resetForm();
      this.showPreview = false;
    }, 300);
  }

 async salvarChamado() {
    // Validação especial para o campo atendente em modo de edição
    if (this.isEditMode) {
        this.ticketForm.get('atendente')?.setValidators([Validators.required]);
    } else {
        this.ticketForm.get('atendente')?.clearValidators();
    }
    this.ticketForm.get('atendente')?.updateValueAndValidity();

    if (!this.ticketForm.valid) {
      this.showToast('Preencha os campos obrigatórios corretamente', 'error');
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const formValue = this.ticketForm.getRawValue();

      if (this.isEditMode && this.chamadoParaEditar) {
        const chamadoAtualizado: Chamado = {
          ...this.chamadoParaEditar,
          cliente: this.getClienteLabel(formValue.cliente),
          categoria: this.getAssuntoLabel(formValue.assunto),
          atendente: this.getAtendenteLabel(formValue.atendente), // Pega do formulário
          prioridade: this.perfilUsuario === 'supervisor' ? formValue.prioridade : this.chamadoParaEditar.prioridade,
          descricao: formValue.descricao || '',
          status: formValue.status || this.chamadoParaEditar.status,
        };
        this.chamadoAtualizado.emit(chamadoAtualizado);
        this.showToast(`Chamado #${chamadoAtualizado.numeroProtocolo} atualizado!`, 'success');
      } else {
        // MODO DE CRIAÇÃO
        const novoChamado: NovoChamado = {
          numeroProtocolo: formValue.numeroProtocolo,
          cliente: this.getClienteLabel(formValue.cliente),
          assunto: this.getAssuntoLabel(formValue.assunto),
          atendente: this.usuarioLogadoNome, // <-- MUDANÇA PRINCIPAL AQUI
          data: formValue.data,
          hora: formValue.hora,
          prioridade: formValue.prioridade,
          descricao: formValue.descricao || '',
          status: 'aberto',
          dataHoraCriacao: new Date().toISOString()
        };
        this.chamadoCriado.emit(novoChamado);
        this.showToast(`Chamado #${novoChamado.numeroProtocolo} criado com sucesso!`, 'success');
      }
      setTimeout(() => this.closeModalHandler(), 1500);
    } catch (error) {
      this.showToast('Ocorreu um erro ao salvar.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  protocolValidator(control: any) {
    if (!this.isEditMode && control.value && this.chamadosService.protocoloExiste(control.value)) {
      return { protocolExists: true };
    }
    return null;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isVisible) {
      this.closeModalHandler();
    }
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  resetForm() {
    this.ticketForm.reset();
    this.initializeForm();
    this.hideToast();
  }

  isFormValid(): boolean {
    return this.ticketForm.valid;
  }

  showPreviewHandler() {
    if (this.isFormValid()) {
      this.showPreview = true;
    } else {
      this.showToast('Preencha todos os campos obrigatórios', 'warning');
      this.markAllFieldsAsTouched();
    }
  }

  markAllFieldsAsTouched() {
    Object.keys(this.ticketForm.controls).forEach(key => {
      this.ticketForm.get(key)?.markAsTouched();
    });
  }

  backToForm() {
    this.showPreview = false;
  }

  getClienteLabel(value: string): string {
    return this.clienteOptions.find(opt => opt.value === value)?.label || value;
  }

  getAssuntoLabel(value: string): string {
    return this.assuntoOptions.find(opt => opt.value === value)?.label || value;
  }

  getAtendenteLabel(value: string): string {
    return this.atendenteOptions.find(opt => opt.value === value)?.label || value;
  }

  getPrioridadeLabel(value: string): 'baixa' | 'media' | 'alta' | 'urgente' {
    return value as any;
  }

  getPreviewData() {
    const formValue = this.ticketForm.getRawValue();
    return {
      numeroProtocolo: formValue.numeroProtocolo,
      cliente: this.getClienteLabel(formValue.cliente),
      assunto: this.getAssuntoLabel(formValue.assunto),
      atendente: this.getAtendenteLabel(formValue.atendente),
      dataHora: this.formatDateTime(formValue.data, formValue.hora),
      prioridade: this.getPrioridadeLabel(formValue.prioridade),
      descricao: formValue.descricao || 'Nenhuma descrição fornecida'
    };
  }

  formatDateTime(dateString: string, timeString: string): string {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPriorityClass(): string {
    const p = this.ticketForm.get('prioridade')?.value;
    switch (p) {
      case 'baixa': return 'priority-low';
      case 'media': return 'priority-medium';
      case 'alta': return 'priority-high';
      case 'urgente': return 'priority-urgent';
      default: return 'priority-medium';
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.toast = { message, type, visible: true };
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.toast.visible = false;
  }

  getToastClass(): string {
    return `toast-${this.toast.type}`;
  }

  getToastIcon(): string {
    switch (this.toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.ticketForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.ticketForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['pattern']) {
        return 'Protocolo deve conter apenas números';
      }
      if (field.errors['protocolExists']) {
        return 'Este número de protocolo já existe.';
      }
    }
    return '';
  }
}