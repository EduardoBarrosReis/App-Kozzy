import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChamadosService } from '../chamados.service'; // Ajuste o caminho conforme necessário

interface NovoChamado {
  numeroProtocolo: string;
  cliente: string;
  assunto: string;
  atendente: string;
  data: string;
  hora: string;
  prioridade: string;
  descricao: string;
  status: 'aberto';
  dataHoraCriacao: string;
}

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
export class CreateTicketModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();

  ticketForm!: FormGroup;
  isLoading = false;
  showPreview = false;

  // Toast para feedback
  toast: ToastMessage = {
    message: '',
    type: 'info',
    visible: false
  };

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
    private chamadosService: ChamadosService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // Formato HH:MM

    this.ticketForm = this.fb.group({
      numeroProtocolo: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.pattern(/^[0-9]+$/), // Apenas números
        this.protocolValidator.bind(this)
      ]],
      cliente: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: ['', Validators.required],
      data: [{ value: today, disabled: true }, Validators.required],
      hora: [{ value: currentTime, disabled: true }, Validators.required],
      prioridade: ['media'], // Valor padrão
      descricao: ['', Validators.maxLength(500)] // Campo opcional com limite
    });
  }

  // Validador customizado para verificar se o protocolo já existe usando o serviço
  protocolValidator(control: any) {
    const value = control.value;
    if (value && this.chamadosService.protocoloExiste(value)) {
      return { protocolExists: true };
    }
    return null;
  }

  // Listener para fechar modal com ESC
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isVisible) {
      this.closeModalHandler();
    }
  }

  // Fechar modal
  closeModalHandler() {
    this.closeModal.emit();
    this.resetForm();
    this.showPreview = false;
  }

  // Fechar modal ao clicar no overlay
  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModalHandler();
    }
  }

  // Reset do formulário
  resetForm() {
    this.ticketForm.reset();
    this.initializeForm();
    this.hideToast();
  }

  // Verificar se o formulário é válido
  isFormValid(): boolean {
    const requiredFields = ['numeroProtocolo', 'cliente', 'assunto', 'atendente'];
    return requiredFields.every(field => 
      this.ticketForm.get(field)?.valid && this.ticketForm.get(field)?.value
    );
  }

  // Mostrar preview do chamado
  showPreviewHandler() {
    if (this.isFormValid()) {
      this.showPreview = true;
    } else {
      this.showToast('Preencha todos os campos obrigatórios antes de visualizar', 'warning');
      this.markAllFieldsAsTouched();
    }
  }

  // Marcar todos os campos como tocados para mostrar erros
  markAllFieldsAsTouched() {
    Object.keys(this.ticketForm.controls).forEach(key => {
      this.ticketForm.get(key)?.markAsTouched();
    });
  }

  // Voltar do preview para o formulário
  backToForm() {
    this.showPreview = false;
  }

  // Salvar chamado
  async salvarChamado() {
    if (!this.isFormValid()) {
      this.showToast('Preencha todos os campos obrigatórios', 'error');
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      const formValue = this.ticketForm.getRawValue(); // getRawValue() inclui campos disabled
      
      const novoChamado: NovoChamado = {
        numeroProtocolo: formValue.numeroProtocolo,
        cliente: this.getClienteLabel(formValue.cliente),
        assunto: this.getAssuntoLabel(formValue.assunto),
        atendente: this.getAtendenteLabel(formValue.atendente),
        data: formValue.data,
        hora: formValue.hora,
        prioridade: this.getPrioridadeLabel(formValue.prioridade),
        descricao: formValue.descricao || '',
        status: 'aberto',
        dataHoraCriacao: new Date().toISOString()
      };

      // Emitir evento para o componente pai
      this.chamadoCriado.emit(novoChamado);

      this.showToast(`Chamado #${formValue.numeroProtocolo} criado com sucesso!`, 'success');

      // Fechar modal após 2 segundos
      setTimeout(() => {
        this.closeModalHandler();
      }, 2000);

    } catch (error) {
      console.error('Erro ao salvar chamado:', error);
      this.showToast('Falha ao criar chamado. Tente novamente.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Métodos para obter labels das opções
  getClienteLabel(value: string): string {
    const option = this.clienteOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  getAssuntoLabel(value: string): string {
    const option = this.assuntoOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  getAtendenteLabel(value: string): string {
    const option = this.atendenteOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  getPrioridadeLabel(value: string): string {
    const option = this.prioridadeOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Obter dados do preview
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

  // Formatar data e hora para exibição
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

  // Obter classe CSS para prioridade
  getPriorityClass(): string {
    const prioridade = this.ticketForm.get('prioridade')?.value;
    switch (prioridade) {
      case 'baixa': return 'priority-low';
      case 'media': return 'priority-medium';
      case 'alta': return 'priority-high';
      case 'urgente': return 'priority-urgent';
      default: return 'priority-medium';
    }
  }

  // Métodos para Toast
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.toast = {
      message,
      type,
      visible: true
    };

    // Auto-hide baseado no tipo
    const hideDelay = type === 'success' ? 3000 : type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      this.hideToast();
    }, hideDelay);
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
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  // Métodos para validação de campos
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
      if (field.errors['minlength']) {
        return 'Protocolo deve ter pelo menos 3 caracteres';
      }
      if (field.errors['pattern']) {
        return 'Protocolo deve conter apenas números';
      }
      if (field.errors['protocolExists']) {
        return 'Este número de protocolo já existe. Use um número diferente.';
      }
      if (field.errors['maxlength']) {
        return `Máximo de ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    
    return '';
  }
}

