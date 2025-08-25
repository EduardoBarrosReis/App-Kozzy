import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
loginForm!: FormGroup;
  passwordFieldType: string = 'password';

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Form Submitted!', this.loginForm.value);
      // Aqui você integraria com seu serviço de autenticação
      alert('Funcionalidade de login seria implementada aqui com os dados: ' + JSON.stringify(this.loginForm.value));
    } else {
      // Marca todos os campos como 'touched' para exibir mensagens de erro
      this.loginForm.markAllAsTouched();
      alert('Por favor, preencha todos os campos corretamente.');
    }
  }
}
