import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { UsuarioLogado } from '../auth.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent {
  @Input() chamado!: Chamado;
  @Input() usuarioLogado!: UsuarioLogado | null;
  
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Chamado>();

  onClose() {
    this.close.emit();
  }

  // Lógica de verificação
  podeEditar(): boolean {
    if (!this.usuarioLogado || !this.chamado) return false;

    // 1. Supervisor: Pode tudo
    if (this.usuarioLogado.perfil === 'supervisor') return true;

    // 2. Atendente:
    // - Deve ser o dono do chamado (nome igual)
    const nomeBate = this.usuarioLogado.nome.toLowerCase() === (this.chamado.atendente || '').toLowerCase();
    
    // - E deve ter a área do chamado nas suas permissões
    const areasDoUsuario = this.usuarioLogado.areas || [];
    const areaDoChamado = this.chamado.area;
    const areaBate = areasDoUsuario.includes(areaDoChamado);

    return this.usuarioLogado.perfil === 'atendente' && nomeBate && areaBate;
  }

  onEdit() {
    if (this.podeEditar()) {
      this.edit.emit(this.chamado);
    } else {
      let motivo = '';
      if (this.usuarioLogado?.nome.toLowerCase() !== (this.chamado.atendente || '').toLowerCase()) {
          motivo = 'Você não é o responsável por este chamado.';
      } else {
          motivo = 'Este chamado pertence a uma área que você não tem acesso.';
      }
      alert(`⛔ ACESSO NEGADO\n\n${motivo}`);
    }
  }

  // Helpers
  getStatusLabel(s: string) { const m:any={'aberto':'Aberto','em-andamento':'Em Andamento','fechado':'Fechado'}; return m[s]||s; }
  getPrioridadeLabel(p: string) { const m:any={'baixa':'Baixa','media':'Média','alta':'Alta','urgente':'Urgente'}; return m[p]||p; }
}