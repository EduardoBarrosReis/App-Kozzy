// src/app/create-ticket-modal/create-ticket-modal.component.ts (CÓDIGO COMPLETO E ATUALIZADO)

import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChamadosService, Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service'; // Importar o AuthService

interface ToastMessage { message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean; }
interface SelectOption { value: string; label: string; icon?: string; }

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css'],
  animations: [
    trigger('fadeIn', [ transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]), transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]) ]),
    trigger('slideIn', [ transition(':enter', [ style({ transform: 'translateY(-30px)', opacity: 0 }), animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })) ]) ])
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
  clienteOptions: SelectOption[] = [ { value: 'entregador', label: '🚴 Entregador' }, { value: 'cliente', label: '👤 Cliente Final' }, { value: 'loja', label: '🏪 Loja/Estabelecimento' } ];
  assuntoOptions: SelectOption[] = [ { value: 'tecnico', label: '🔧 Suporte Técnico' }, { value: 'entrega', label: '📦 Problemas de Entrega' }, { value: 'pagamento', label: '💳 Questões de Pagamento' }, { value: 'cadastro', label: '📝 Cadastro/Dados' }, { value: 'comercial', label: '💼 Comercial/Vendas' }, { value: 'financeiro', label: '💰 Financeiro' }, { value: 'outros', label: '❓ Outros Assuntos' } ];
  atendenteOptions: SelectOption[] = []; // Será preenchido dinamicamente
  prioridadeOptions: SelectOption[] = [ { value: 'baixa', label: '🟢 Baixa Prioridade' }, { value: 'media', label: '🟡 Média Prioridade' }, { value: 'alta', label: '🟠 Alta Prioridade' }, { value: 'urgente', label: '🔴 Urgente' } ];

  constructor(
    private fb: FormBuilder,
    private chamadosService: ChamadosService,
    private authService: AuthService // Injetar o AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarOpcoesDeAtendentes();
  }

  carregarOpcoesDeAtendentes(): void {
    const todosUsuarios = this.authService.getTodosUsuarios();
    this.atendenteOptions = todosUsuarios.map(usuario => ({
      value: usuario.nome,
      label: `👤 ${usuario.nome}`
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm(); // Reinicia o form com as regras corretas
      
      if (this.isEditMode && this.chamadoParaEditar) {
        this.populateFormForEdit();
      }
    }
  }

  initializeForm() {
    const now = new Date();
    this.ticketForm = this.fb.group({
      numeroProtocolo: [{ value: '', disabled: this.isEditMode }, [Validators.required, Validators.pattern(/^[0-9]+$/), this.protocolValidator.bind(this)]],
      cliente: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: [{ value: '', disabled: true }],
      data: [{ value: now.toISOString().split('T')[0], disabled: true }],
      hora: [{ value: now.toTimeString().slice(0, 5), disabled: true }],
      prioridade: [{ value: 'media', disabled: true }],
      descricao: ['', Validators.maxLength(500)]
    });

    // Habilita campos SOMENTE se for supervisor e estiver em modo de edição
    if (this.isEditMode && this.perfilUsuario === 'supervisor') {
      this.ticketForm.get('atendente')?.enable();
      this.ticketForm.get('prioridade')?.enable();
    }
  }

  populateFormForEdit(): void {
    if (!this.chamadoParaEditar) return;
    this.ticketForm.patchValue({
      numeroProtocolo: this.chamadoParaEditar.numeroProtocolo,
      cliente: this.clienteOptions.find(opt => this.chamadoParaEditar!.cliente.includes(opt.label))?.value || '',
      assunto: this.assuntoOptions.find(opt => opt.label.includes(this.chamadoParaEditar!.categoria))?.value || '',
      atendente: this.chamadoParaEditar.atendente,
      data: this.chamadoParaEditar.dataAbertura,
      hora: this.chamadoParaEditar.horaAbertura,
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao
    });
  }
  
  async salvarChamado() {
    if (this.ticketForm.invalid) { this.markAllFieldsAsTouched(); this.showToast('Preencha os campos obrigatórios', 'error'); return; }
    this.isLoading = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const formValue = this.ticketForm.getRawValue();

      if (this.isEditMode && this.chamadoParaEditar) {
        const chamadoAtualizado: Chamado = { ...this.chamadoParaEditar, cliente: this.getLabelByValue(this.clienteOptions, formValue.cliente), categoria: this.getLabelByValue(this.assuntoOptions, formValue.assunto), atendente: formValue.atendente, prioridade: formValue.prioridade, descricao: formValue.descricao || '' };
        this.chamadoAtualizado.emit(chamadoAtualizado);
        this.showToast(`Chamado #${chamadoAtualizado.numeroProtocolo} atualizado!`, 'success');
      } else {
        const novoChamado: NovoChamado = { numeroProtocolo: formValue.numeroProtocolo, cliente: this.getLabelByValue(this.clienteOptions, formValue.cliente), assunto: this.getLabelByValue(this.assuntoOptions, formValue.assunto), atendente: this.usuarioLogadoNome, data: formValue.data, hora: formValue.hora, prioridade: 'media', descricao: formValue.descricao || '', status: 'aberto', dataHoraCriacao: new Date().toISOString() };
        this.chamadoCriado.emit(novoChamado);
        this.showToast(`Chamado #${novoChamado.numeroProtocolo} criado com sucesso!`, 'success');
      }
      setTimeout(() => this.closeModalHandler(), 1500);
    } catch (error) { this.showToast('Ocorreu um erro ao salvar.', 'error'); } finally { this.isLoading = false; }
  }

  // --- O RESTO DOS SEUS MÉTODOS CONTINUA AQUI ---
  getLabelByValue(options: SelectOption[], value: string): string { return options.find(opt => opt.value === value)?.label || value; }
  closeModalHandler() { this.closeModal.emit(); setTimeout(() => { this.isEditMode = false; this.chamadoParaEditar = null; this.resetForm(); this.showPreview = false; }, 300); }
  protocolValidator(control: any): { [key: string]: boolean } | null { if (!this.isEditMode && control.value && this.chamadosService.protocoloExiste(control.value)) { return { protocolExists: true }; } return null; }
  @HostListener('document:keydown.escape', ['$event']) onEscapeKey(event: KeyboardEvent) { if (this.isVisible) { this.closeModalHandler(); } }
  onOverlayClick(event: MouseEvent) { if (event.target === event.currentTarget) { this.closeModalHandler(); } }
  resetForm() { this.ticketForm.reset(); this.initializeForm(); this.hideToast(); }
  isFormValid(): boolean { return this.ticketForm.valid; }
  showPreviewHandler() { if (this.isFormValid()) { this.showPreview = true; } else { this.markAllFieldsAsTouched(); this.showToast('Preencha os campos obrigatórios', 'warning'); } }
  markAllFieldsAsTouched() { Object.keys(this.ticketForm.controls).forEach(key => { this.ticketForm.get(key)?.markAsTouched(); }); }
  backToForm() { this.showPreview = false; }
  getPrioridadeLabel(value: string): string { return this.prioridadeOptions.find(opt => opt.value === value)?.label || '🟡 Média Prioridade'; }
  getPreviewData() { const formValue = this.ticketForm.getRawValue(); return { numeroProtocolo: formValue.numeroProtocolo, cliente: this.getLabelByValue(this.clienteOptions, formValue.cliente), assunto: this.getLabelByValue(this.assuntoOptions, formValue.assunto), atendente: this.getLabelByValue(this.atendenteOptions, formValue.atendente), dataHora: this.formatDateTime(formValue.data, formValue.hora), prioridade: this.getPrioridadeLabel(formValue.prioridade), descricao: formValue.descricao || 'Nenhuma descrição fornecida' }; }
  formatDateTime(dateString: string, timeString: string): string { const date = new Date(`${dateString}T${timeString}`); return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  getPriorityClass(): string { const p = this.ticketForm.get('prioridade')?.value; switch (p) { case 'baixa': return 'priority-low'; case 'media': return 'priority-medium'; case 'alta': return 'priority-high'; case 'urgente': return 'priority-urgent'; default: return 'priority-medium'; } }
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') { this.toast = { message, type, visible: true }; setTimeout(() => { this.hideToast(); }, 3000); }
  hideToast() { this.toast.visible = false; }
  getToastClass(): string { return `toast-${this.toast.type}`; }
  getToastIcon(): string { switch (this.toast.type) { case 'success': return '✅'; case 'error': return '❌'; case 'warning': return '⚠️'; default: return 'ℹ️'; } }
  hasFieldError(fieldName: string): boolean { const field = this.ticketForm.get(fieldName); return !!(field && field.invalid && field.touched); }
  getFieldError(fieldName: string): string { const field = this.ticketForm.get(fieldName); if (field?.errors) { if (field.errors['required']) { return 'Este campo é obrigatório'; } if (field.errors['pattern']) { return 'Protocolo deve conter apenas números'; } if (field.errors['protocolExists']) { return 'Este número de protocolo já existe.'; } } return ''; }
}