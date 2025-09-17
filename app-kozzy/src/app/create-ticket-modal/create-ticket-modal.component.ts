import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface NovoChamado {
  id: string;
  cliente: string;
  assunto: string;
  atendente: string;
  data: string;
  descricao: string;
  status: 'aberto';
  prioridade: 'media';
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
}

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
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
  clienteOptions = [
    { value: 'entregador', label: 'Entregador' },
    { value: 'cliente', label: 'Cliente' }
  ];

  assuntoOptions = [
    { value: 'tecnico', label: 'Técnico' },
    { value: 'suporte', label: 'Suporte' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'financeiro', label: 'Financeiro' }
  ];

  atendenteOptions = [
    { value: 'mariana', label: 'Mariana' },
    { value: 'fernanda', label: 'Fernanda' },
    { value: 'carla', label: 'Carla' }
  ];

  // Lista de IDs existentes para validação (simulado)
  existingIds: string[] = ['10234', '10235', '10236', '10237', '10238', '10239', '10240', '10241'];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    this.ticketForm = this.fb.group({
      id: ['', [Validators.required, Validators.minLength(3), this.idValidator.bind(this)]],
      cliente: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: ['', Validators.required],
      data: [{ value: today, disabled: true }, Validators.required],
      descricao: [''] // Campo opcional
    });
  }

  // Validador customizado para verificar se o ID já existe
  idValidator(control: any) {
    const value = control.value;
    if (value && this.existingIds.includes(value)) {
      return { idExists: true };
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
    const requiredFields = ['id', 'cliente', 'assunto', 'atendente'];
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
    }
  }

  // Voltar do preview para o formulário
  backToForm() {
    this.showPreview = false;
  }

  // Salvar chamado
  async salvarChamado() {
    if (!this.isFormValid()) {
      this.showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    this.isLoading = true;

    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const formValue = this.ticketForm.getRawValue(); // getRawValue() inclui campos disabled
      
      const novoChamado: NovoChamado = {
        id: formValue.id,
        cliente: this.getClienteLabel(formValue.cliente),
        assunto: this.getAssuntoLabel(formValue.assunto),
        atendente: this.getAtendenteLabel(formValue.atendente),
        data: formValue.data,
        descricao: formValue.descricao || '',
        status: 'aberto',
        prioridade: 'media'
      };

      // Adicionar o ID à lista de existentes para evitar duplicatas
      this.existingIds.push(formValue.id);

      // Emitir evento para o componente pai
      this.chamadoCriado.emit(novoChamado);

      this.showToast('Chamado criado com sucesso!', 'success');

      // Fechar modal após 1.5 segundos
      setTimeout(() => {
        this.closeModalHandler();
      }, 1500);

    } catch (error) {
      this.showToast('Falha ao salvar chamado. Tente novamente.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Obter label do cliente
  getClienteLabel(value: string): string {
    const option = this.clienteOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Obter label do assunto
  getAssuntoLabel(value: string): string {
    const option = this.assuntoOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Obter label do atendente
  getAtendenteLabel(value: string): string {
    const option = this.atendenteOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  // Obter dados do preview
  getPreviewData() {
    const formValue = this.ticketForm.getRawValue();
    return {
      id: formValue.id,
      cliente: this.getClienteLabel(formValue.cliente),
      assunto: this.getAssuntoLabel(formValue.assunto),
      atendente: this.getAtendenteLabel(formValue.atendente),
      data: this.formatDate(formValue.data),
      descricao: formValue.descricao || 'Nenhuma descrição fornecida'
    };
  }

  // Formatar data para exibição
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  // Mostrar toast
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.toast = {
      message,
      type,
      visible: true
    };

    // Auto-hide após 3 segundos para success, 5 segundos para error
    const hideDelay = type === 'success' ? 3000 : 5000;
    setTimeout(() => {
      this.hideToast();
    }, hideDelay);
  }

  // Esconder toast
  hideToast() {
    this.toast.visible = false;
  }

  // Obter classe CSS para o toast
  getToastClass(): string {
    switch (this.toast.type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
      default:
        return 'toast-info';
    }
  }

  // Obter ícone do toast
  getToastIcon(): string {
    switch (this.toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  }

  // Verificar se um campo específico tem erro
  hasFieldError(fieldName: string): boolean {
    const field = this.ticketForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Obter mensagem de erro para um campo
  getFieldError(fieldName: string): string {
    const field = this.ticketForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['minlength']) {
        return 'ID deve ter pelo menos 3 caracteres';
      }
      if (field.errors['idExists']) {
        return 'Este ID já existe. Use um ID diferente.';
      }
    }
    
    return '';
  }
}

