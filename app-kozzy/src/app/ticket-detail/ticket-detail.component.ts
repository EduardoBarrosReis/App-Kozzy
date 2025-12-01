import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { UsuarioLogado } from '../auth.service'; // Importe a interface do usuário

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent {
  @Input() chamado!: Chamado;
  @Input() usuarioLogado!: UsuarioLogado | null; // <--- RECEBE O USUÁRIO PARA VALIDAR
  
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Chamado>();

  onClose() {
    this.close.emit();
  }

  // --- TRAVA DE SEGURANÇA ---
  podeEditar(): boolean {
    if (!this.usuarioLogado || !this.chamado) return false;

    // 1. Supervisor pode tudo
    if (this.usuarioLogado.perfil === 'supervisor') return true;

    // 2. Atendente só pode se o chamado for dele
    if (this.usuarioLogado.perfil === 'atendente' && this.chamado.atendente === this.usuarioLogado.nome) {
      return true;
    }

    return false;
  }

  onEdit() {
    if (this.podeEditar()) {
      this.edit.emit(this.chamado);
    } else {
      alert('⛔ Você não tem permissão para editar este chamado.');
    }
  }

  // Helpers
  getStatusLabel(status: string): string {
    const map: any = { 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Fechado' };
    return map[status] || status;
  }

  getPrioridadeLabel(prioridade: string): string {
    const map: any = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' };
    return map[prioridade] || prioridade;
  }
}