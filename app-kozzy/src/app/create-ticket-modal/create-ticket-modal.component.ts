import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chamado, NovoChamado } from '../chamados.service'; // Removi ChamadosService pois o modal apenas emite dados
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
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
  @Input() perfilUsuario: string = 'atendente';
  @Input() usuarioLogadoNome: string = '';

  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  ticketForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  showPreview = false;

  // --- OPÇÕES DOS SELECTS (Alinhados com o Backend Atendimento.js) ---
  
  // IMPORTANTE: Os 'values' aqui devem ser EXATAMENTE iguais ao enum do seu Mongoose
  areaOptions: SelectOption[] = [
  { value: 'Logistica', label: '📦 Logística' },
  { value: 'Contas a Pagar', label: '💸 Contas a Pagar' },
  { value: 'Contas a Receber', label: '💵 Contas a Receber' },
  { value: 'Compra', label: '🛒 Compras' },
  { value: 'T.I', label: '💻 T.I' },
  { value: 'Comercial', label: '📞 Comercial' }
  ];

  // Assuntos continuam genéricos pois o backend agrupa tudo em "categoriaAssunto" (que é a Area)
  // Mas mantemos aqui para detalhamento na descrição se necessário
  assuntoOptions: SelectOption[] = [
    { value: 'Dúvida Geral', label: 'Dúvida Geral' },
    { value: 'Reclamação', label: 'Reclamação' },
    { value: 'Solicitação de Serviço', label: 'Solicitação de Serviço' },
    { value: 'Erro no Sistema', label: 'Erro no Sistema' },
    { value: 'Troca/Devolução', label: 'Troca/Devolução' }
  ];

  // Alinhado com enum: ["entregador","vendedor", "cliente","interno","supervisor","gerente"]
  clienteOptions: SelectOption[] = [
    { value: 'entregador', label: '🚴 Entregador' },
    { value: 'cliente', label: '👤 Cliente Final' },
    { value: 'vendedor', label: '🏪 Loja/Vendedor' },
    { value: 'interno', label: '🏢 Interno' }
  ];

  atendenteOptions: SelectOption[] = [];
  
  prioridadeOptions: SelectOption[] = [ 
    { value: 'Baixa Prioridade', label: '🟢 Baixa' }, // Values ajustados para o Backend
    { value: 'Média Prioridade', label: '🟡 Média' }, 
    { value: 'Alta Prioridade', label: '🟠 Alta' }, 
    { value: 'Urgente', label: '🔴 Urgente' } 
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarAtendentes();
    this.filtrarAreasPermitidas();
  }

  // --- CARREGAMENTO REAL DE USUÁRIOS ---
  carregarAtendentes() {
    // Agora usamos .subscribe() pois getTodosUsuarios() vai no backend buscar a lista
    this.authService.getTodosUsuarios().subscribe({
      next: (usuarios) => {
        this.atendenteOptions = usuarios.map(u => ({ 
          value: u.nome, // ou u.id se preferir salvar o ID
          label: u.nome 
        }));
      },
      error: (err) => console.error('Erro ao carregar atendentes:', err)
    });
  }
filtrarAreasPermitidas() {
  // Se for supervisor, mantém todas as opções. Se for atendente, busca as dele.
  if (this.perfilUsuario === 'supervisor') return;

  const usuario = this.authService.getUsuarioLogado();
  if (!usuario || !usuario.id) return;

  // Chama o endpoint que você me mostrou: areaController.buscarAreasPorUsuario
  this.http.get<any>(`http://localhost:3000/api/areas/${usuario.id}`).subscribe({
    next: (res) => {
      if (res && res.areas && res.areas.length > 0) {
        // Filtra a lista 'areaOptions' para mostrar APENAS o que veio do banco
        this.areaOptions = this.areaOptions.filter(opt => res.areas.includes(opt.value));
        
        // Se sobrou só uma área, já seleciona ela automaticamente
        if (this.areaOptions.length === 1) {
          this.ticketForm.patchValue({ area: this.areaOptions[0].value });
        }
      }
    },
    error: (err) => console.log('Usuário sem restrição de área ou erro ao buscar.')
  });
}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm(); // Recria o form limpo
      
      // APLICA FILTRO DE ÁREA
      this.aplicarRestricaoDeArea(); 

      if (this.isEditMode) {
        this.populateFormForEdit();
        this.checkPermissionsAndPopulate(); // Trava campos de edição
      } 
    }
  }
aplicarRestricaoDeArea() {
    // 1. Pega usuário atualizado (já com as áreas do login)
    const usuario = this.authService.getUsuarioLogado();
    
    // Se for Supervisor, vê tudo. Se não tiver usuário, não faz nada.
    if (!usuario || usuario.perfil === 'supervisor') return;

    // 2. Filtra as opções do Select
    // Só deixa na lista as áreas que o usuário tem no array 'areas'
    const areasPermitidas = usuario.areas || [];
    
    // Filtra visualmente o select
    const opcoesFiltradas = this.areaOptions.filter(opt => 
        areasPermitidas.includes(opt.value)
    );

    // Se o usuário tem área mas nenhuma bate com as opções do sistema, alerta
    if (opcoesFiltradas.length === 0 && areasPermitidas.length > 0) {
        console.warn('Usuário tem áreas, mas nenhuma corresponde às opções do sistema.');
    } else if (opcoesFiltradas.length > 0) {
        this.areaOptions = opcoesFiltradas;
        
        // Se sobrou só uma opção, já seleciona ela pra facilitar
        if (this.areaOptions.length === 1) {
            this.ticketForm.patchValue({ area: this.areaOptions[0].value });
        }
    }
  }
  checkPermissionsAndPopulate(): void {
    this.populateFormForEdit();

    if (this.perfilUsuario === 'supervisor') {
      this.ticketForm.get('atendente')?.enable();
      this.ticketForm.get('prioridade')?.enable();
    } else {
      this.ticketForm.get('atendente')?.disable();
      this.ticketForm.get('prioridade')?.disable();
    }
  }

  initializeForm() {
    const protocoloValidators = this.isEditMode ? [Validators.required] : [];
    
    this.ticketForm = this.fb.group({
      numeroProtocolo: [{ value: '', disabled: this.isEditMode }, protocoloValidators],
      cliente: ['', Validators.required], // tipoCliente no back
      area: ['', Validators.required],    // categoriaAssunto no back
      assunto: ['', Validators.required], // Apenas visual/descritivo
      atendente: [{ value: '', disabled: true }], 
      prioridade: [{ value: 'Média Prioridade', disabled: true }], // Default ajustado
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

    // Helper simples para evitar null
    const safeValue = (val: any) => val || '';

    this.ticketForm.patchValue({
      numeroProtocolo: this.chamadoParaEditar.numeroProtocolo,
      cliente: safeValue(this.chamadoParaEditar.cliente),
      area: safeValue(this.chamadoParaEditar.area), 
      assunto: safeValue(this.chamadoParaEditar.categoria), // Se categoria for diferente de area
      atendente: this.chamadoParaEditar.atendente,
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao,
      data: this.chamadoParaEditar.dataAbertura,
      hora: this.chamadoParaEditar.horaAbertura
    });
  }

  salvar() {
    if (this.ticketForm.invalid) {
        this.ticketForm.markAllAsTouched();
        return; 
    }

    this.isLoading = true;

    // Simulação de delay apenas visual, o modal emite o evento e o Pai chama a API
    setTimeout(() => {
      const val = this.ticketForm.getRawValue();
      
      // Como ajustamos os 'values' das opções acima para baterem com o backend,
      // não precisamos mais fazer .find().label. Enviamos o valor direto.
      
      if (this.isEditMode && this.chamadoParaEditar) {
        const editado: Chamado = {
          ...this.chamadoParaEditar,
          cliente: val.cliente,
          area: val.area,
          categoria: val.area, // No seu back, categoriaAssunto é a Area
          atendente: val.atendente,
          prioridade: val.prioridade,
          descricao: val.descricao
        };
        this.chamadoAtualizado.emit(editado);
      } else {
        // Estrutura para envio ao Backend
        const novo: NovoChamado = {
          numeroProtocolo: val.numeroProtocolo || undefined, 
          cliente: val.cliente,
          area: val.area, 
          assunto: val.assunto,
          atendente: this.perfilUsuario === 'supervisor' && val.atendente ? val.atendente : this.usuarioLogadoNome,
          prioridade: val.prioridade,
          status: 'aberto',
          descricao: val.descricao,
          data: val.data,
          hora: val.hora,
          dataHoraCriacao: new Date().toISOString()
        };
        this.chamadoCriado.emit(novo);
      }
      this.isLoading = false;
    }, 500);
  }

  close() { this.closeModal.emit(); }
  closeModalHandler() { this.close(); }
  onOverlayClick(event: MouseEvent) { if ((event.target as HTMLElement).classList.contains('modal-overlay')) { this.close(); } }
  showPreviewHandler() { this.showPreview = true; }
  backToForm() { this.showPreview = false; }
  getPreviewData() { return this.ticketForm.getRawValue(); } 
  
  hasFieldError(field: string): boolean { 
    const control = this.ticketForm.get(field); 
    return !!(control && control.invalid && (control.dirty || control.touched)); 
  }
  
  getFieldError(field: string): string { 
    const control = this.ticketForm.get(field); 
    if (control?.errors?.['required']) return 'Campo obrigatório'; 
    return ''; 
  }
  
  salvarChamado() { this.salvar(); }
}