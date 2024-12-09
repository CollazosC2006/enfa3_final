import { NgClass, NgFor, NgStyle } from '@angular/common';
import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-flow-rules',
  standalone: true,
  imports: [NgStyle,NgFor,FormsModule],
  templateUrl: './flow-rules.component.html',
  styleUrl: './flow-rules.component.css'
})
export class FlowRulesComponent {
  flowRules = ''; // Contenido del textarea

  switches = ['S1', 'S2', 'S3', 'S4', 'S5']; // Opciones del select
  selectedSwitch = 'S1'; // Valor seleccionado
  rules = [
    'Regla 1: Permitir tráfico en puerto 1.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Regla 2: Bloquear tráfico en puerto 3.',
    'Regla 3: Redirigir puerto 2 al puerto 4.',
  ]; // Reglas de ejemplo


  onSubmit() {
    console.log('Formulario enviado con las reglas:', this.flowRules);
    this.flowRules='';
    // Aquí puedes añadir lógica para enviar los datos al servidor
  }

  
}
