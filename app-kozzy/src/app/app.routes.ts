import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CentralAtendimentoComponent } from './central-atendimento/central-atendimento.component';
import { RecuperarComponent } from './recuperar/recuperar.component';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard.component';
import { SupervisorGuard, AtendenteGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar', component: RecuperarComponent },
  {
    path: 'supervisor',
    component: SupervisorDashboardComponent,
    canActivate: [SupervisorGuard]
  },
  {
    path: 'central',
    component: CentralAtendimentoComponent,
    canActivate: [AtendenteGuard]
  },
  // Rota curinga para redirecionar para o login se a rota não for encontrada
  { path: '**', redirectTo: '/login' }
];
export class AppRoutingModule { }