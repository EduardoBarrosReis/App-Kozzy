import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Ajuste o caminho conforme necessário

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  passwordFieldType: string = 'password';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });

    // Verificar se já está logado e redirecionar
    if (this.authService.isLogado()) {
      const usuario = this.authService.getUsuarioLogado();
      if (usuario?.perfil === 'supervisor') {
        this.router.navigate(['/supervisor']);
      } else {
        this.router.navigate(['/central']);
      }
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;

      // Usar o serviço de autenticação para fazer login
      const loginSucesso = this.authService.login(email, password, rememberMe);

      if (loginSucesso) {
        const usuario = this.authService.getUsuarioLogado();
        const mensagemSucesso = usuario?.perfil === 'supervisor' 
          ? `Bem-vindo, ${usuario.nome}! Redirecionando para o Dashboard do Supervisor...`
          : `Bem-vindo, ${usuario?.nome}! Redirecionando para a Central de Atendimento...`;
        
        alert(mensagemSucesso);
        // O redirecionamento já é feito pelo AuthService
      } else {
        alert('Login e/ou senha inválidos.');
      }
    } else {
      // Marca todos os campos como 'touched' para exibir mensagens de erro
      this.loginForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos corretamente.');
    }
  }
}

