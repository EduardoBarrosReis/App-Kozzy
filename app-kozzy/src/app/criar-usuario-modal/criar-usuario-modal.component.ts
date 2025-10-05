// src/app/criar-usuario-modal/criar-usuario-modal.component.ts (CÓDIGO COMPLETO)

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

// Validador customizado para senhas
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
  @Output() usuarioCriado = new EventEmitter<string>(); // Emite a mensagem de sucesso

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
      const resultado = this.authService.criarUsuario({ nome, email, perfil, password: senha });
      
      if (resultado.sucesso) {
        this.usuarioCriado.emit(resultado.mensagem);
      } else {
        alert(resultado.mensagem); // Mostra erro se o usuário já existir
      }
    } else {
      this.criarUsuarioForm.markAllAsTouched();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}