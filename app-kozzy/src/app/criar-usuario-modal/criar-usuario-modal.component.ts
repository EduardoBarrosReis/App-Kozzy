import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

// Validador customizado para senhas (mantido igual)
export function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha');
  const confirmarSenha = control.get('confirmarSenha');
  if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
    confirmarSenha.setErrors({ senhasNaoCoincidem: true });
    return { senhasNaoCoincidem: true };
  }
  return null;
}

@Component({
  selector: 'app-criar-usuario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './criar-usuario-modal.component.html',
  styleUrls: ['./criar-usuario-modal.component.css']
})
export class CriarUsuarioModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() usuarioCriado = new EventEmitter<string>();

  criarUsuarioForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.criarUsuarioForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.minLength(3)]],
      perfil: ['atendente', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: senhasIguaisValidator });
  }

  onSubmit(): void {
    if (this.criarUsuarioForm.valid) {
      const { nome, email, perfil, senha } = this.criarUsuarioForm.value;

      // O objeto que passamos aqui deve combinar com o que o AuthService espera
      const dadosNovoUsuario = {
        nome,
        email,
        perfil,
        password: senha // Mapeamos 'senha' do form para 'password' que o service espera
      };

      // --- MUDANÇA PRINCIPAL AQUI ---
      this.authService.criarUsuario(dadosNovoUsuario).subscribe({
        next: (response) => {
          // Sucesso: Backend retornou 201 Created
          const msg = response.message || 'Usuário criado com sucesso!';
          
          this.usuarioCriado.emit(msg);
          this.criarUsuarioForm.reset(); // Limpa o formulário
          this.onClose(); // Fecha o modal
        },
        error: (err) => {
          // Erro: Backend retornou 400 ou 500 (Ex: Email já existe)
          console.error('Erro ao criar usuário:', err);
          const msgErro = err.error?.message || 'Erro ao criar usuário.';
          alert(msgErro);
        }
      });
      
    } else {
      this.criarUsuarioForm.markAllAsTouched();
    }
  }

  onClose(): void {
    this.closeModal.emit();
    // Opcional: Resetar o form ao fechar se quiser limpar dados não salvos
    // this.criarUsuarioForm.reset(); 
  }
}