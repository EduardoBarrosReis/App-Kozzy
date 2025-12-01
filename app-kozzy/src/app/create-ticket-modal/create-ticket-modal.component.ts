import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChamadosService, Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service';

interface SelectOption { value: string; label: string; }

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
})
export class CreateTicketModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() chamadoParaEditar?: Chamado | null;
  @Input() perfilUsuario: 'supervisor' | 'atendente' = 'atendente';
  @Input() usuarioLogadoNome: string = '';

  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  ticketForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  showPreview = false;

  // --- OPÇÕES DOS SELECTS ---
  areaOptions: SelectOption[] = [
    { value: 'financeiro', label: '💰 Financeiro' },
    { value: 'estoque', label: '📦 Estoque / Logística' },
    { value: 'tecnico', label: '🔧 Suporte Técnico' },
    { value: 'comercial', label: '📞 Comercial / Vendas' },
    { value: 'rh', label: '👥 Recursos Humanos' },
    { value: 'cadastro', label: '📝 Cadastro / Dados' },
    { value: 'outros', label: '❓ Outros' }
  ];

  assuntoOptions: SelectOption[] = [
    { value: 'duvida', label: 'Dúvida Geral' },
    { value: 'reclamacao', label: 'Reclamação' },
    { value: 'solicitacao', label: 'Solicitação de Serviço' },
    { value: 'bug', label: 'Erro no Sistema' },
    { value: 'troca', label: 'Troca/Devolução' }
  ];

  clienteOptions: SelectOption[] = [
    { value: 'entregador', label: '🚴 Entregador' },
    { value: 'cliente', label: '👤 Cliente Final' },
    { value: 'loja', label: '🏪 Loja/Estabelecimento' }
  ];

  atendenteOptions: SelectOption[] = [];
  prioridadeOptions: SelectOption[] = [ { value: 'baixa', label: '🟢 Baixa' }, { value: 'media', label: '🟡 Média' }, { value: 'alta', label: '🟠 Alta' }, { value: 'urgente', label: '🔴 Urgente' } ];

  constructor(
    private fb: FormBuilder,
    private chamadosService: ChamadosService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarAtendentes();
  }

  carregarAtendentes() {
    this.atendenteOptions = this.authService.getTodosUsuarios().map(u => ({ value: u.nome, label: u.nome }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm();
      if (this.isEditMode) {
        this.checkPermissionsAndPopulate();
      } else {
        // Modo Criação: Supervisor pode definir atendente/prioridade logo de cara?
        // Se sim, habilita aqui também:
        if (this.perfilUsuario === 'supervisor') {
            this.ticketForm.get('atendente')?.enable();
            this.ticketForm.get('prioridade')?.enable();
        }
      }
    }
  }
checkPermissionsAndPopulate(): void {
    // 1. Preenche os dados
    this.populateFormForEdit();

    // 2. Aplica a Regra de Negócio do Supervisor
    if (this.perfilUsuario === 'supervisor') {
      // Supervisor: Pode mudar Atendente e Prioridade
      this.ticketForm.get('atendente')?.enable();
      this.ticketForm.get('prioridade')?.enable();
    } else {
      // Atendente: Esses campos ficam travados (disabled)
      this.ticketForm.get('atendente')?.disable();
      this.ticketForm.get('prioridade')?.disable();
    }
  }
  initializeForm() {
    const protocoloValidators = this.isEditMode ? [Validators.required] : [];
    
    this.ticketForm = this.fb.group({
      numeroProtocolo: [{ value: '', disabled: this.isEditMode }, protocoloValidators],
      cliente: ['', Validators.required],
      area: ['', Validators.required], // CAMPO AREA ADICIONADO
      assunto: ['', Validators.required],
      atendente: [{ value: '', disabled: true }], 
      prioridade: [{ value: 'media', disabled: true }],
      descricao: ['', Validators.maxLength(500)],
      data: [new Date().toISOString().split('T')[0]],
      hora: [new Date().toTimeString().slice(0, 5)]
    });

    if (this.isEditMode && this.perfilUsuario === 'supervisor') {
      this.ticketForm.get('atendente')?.enable();
      this.ticketForm.get('prioridade')?.enable();
    }
  }

  populateFormForEdit(): void {
    if (!this.chamadoParaEditar) return;

    const findValue = (options: SelectOption[], val: string) => {
      return options.find(opt => val === opt.label || val === opt.value || opt.label.includes(val))?.value || '';
    };

    this.ticketForm.patchValue({
      numeroProtocolo: this.chamadoParaEditar.numeroProtocolo,
      cliente: findValue(this.clienteOptions, this.chamadoParaEditar.cliente),
      area: findValue(this.areaOptions, this.chamadoParaEditar.area || ''), // Recupera Area
      assunto: findValue(this.assuntoOptions, this.chamadoParaEditar.categoria),
      atendente: this.chamadoParaEditar.atendente,
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao,
      data: this.chamadoParaEditar.dataAbertura,
      hora: this.chamadoParaEditar.horaAbertura
    });
  }

  salvar() {
    if (this.ticketForm.invalid) return; 
    this.isLoading = true;
    setTimeout(() => {
      const val = this.ticketForm.getRawValue();
      
      const labelCliente = this.clienteOptions.find(o => o.value === val.cliente)?.label || val.cliente;
      const labelArea = this.areaOptions.find(o => o.value === val.area)?.label || val.area;
      const labelAssunto = this.assuntoOptions.find(o => o.value === val.assunto)?.label || val.assunto;

      if (this.isEditMode && this.chamadoParaEditar) {
        const editado: Chamado = {
          ...this.chamadoParaEditar,
          cliente: labelCliente,
          area: labelArea, // Salva Area
          categoria: labelAssunto,
          atendente: val.atendente,
          prioridade: val.prioridade,
          descricao: val.descricao
        };
        this.chamadoAtualizado.emit(editado);
      } else {
        const novo: NovoChamado = {
          numeroProtocolo: val.numeroProtocolo || undefined, 
          cliente: labelCliente,
          area: labelArea, // Salva Area
          assunto: labelAssunto,
          atendente: this.usuarioLogadoNome,
          prioridade: 'media',
          status: 'aberto',
          descricao: val.descricao,
          data: val.data,
          hora: val.hora,
          dataHoraCriacao: new Date().toISOString()
        };
        this.chamadoCriado.emit(novo);
      }
      this.isLoading = false;
    }, 1000);
  }

  close() { this.closeModal.emit(); }
  closeModalHandler() { this.close(); }
  onOverlayClick(event: MouseEvent) { if ((event.target as HTMLElement).classList.contains('modal-overlay')) { this.close(); } }
  showPreviewHandler() { this.showPreview = true; }
  backToForm() { this.showPreview = false; }
  getPreviewData() { return this.ticketForm.getRawValue(); } 
  hasFieldError(field: string): boolean { const control = this.ticketForm.get(field); return !!(control && control.invalid && (control.dirty || control.touched)); }
  getFieldError(field: string): string { const control = this.ticketForm.get(field); if (control?.errors?.['required']) return 'Campo obrigatório'; return ''; }
  salvarChamado() { this.salvar(); }
}