
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './recuperar.component.html',
  
  styleUrls: ['./recuperar.component.css']
})
export class RecuperarComponent implements OnInit {
  recuperarForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]] // Validação de e-mail
    });
  }

  onSubmit(): void {
    if (this.recuperarForm.valid) {
      const { email } = this.recuperarForm.value;
      console.log('Solicitação de recuperação de senha para:', email);
      alert(`Um e-mail de recuperação de senha foi enviado para ${email}. Por favor, verifique sua caixa de entrada.`);
      // Em um cenário real, você chamaria um serviço aqui para enviar o e-mail
      // Após o envio, você pode redirecionar o usuário de volta para a tela de login
      this.router.navigate(['/login']); // Redireciona para a tela de login
    } else {
      this.recuperarForm.markAllAsTouched();
      alert('Por favor, digite um e-mail válido.');
    }
  }

  goToLogin(event: Event): void {
    event.preventDefault(); // Previne o comportamento padrão do link
    this.router.navigate(['/login']); // Redireciona para a tela de login
  }
}

