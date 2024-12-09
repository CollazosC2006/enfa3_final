import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgFor, NgStyle } from '@angular/common';
import { FlowRulesComponent } from "./flow-rules/flow-rules.component";
import { ExamplesComponent } from './examples/examples.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ NgStyle, NgFor, FlowRulesComponent,FlowRulesComponent,ExamplesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'enfa3_final';


  buttons = [
    { label: 'Botón 1', state: false, color: '#28a745' },
    { label: 'Botón 2', state: false, color: '#007bff' },
    { label: 'Botón 3', state: false, color: '#ffc107' },
    { label: 'Botón 4', state: false, color: '#dc3545' },
    { label: 'Botón 5', state: false, color: '#17a2b8' },
  ];

  
  toggleButton(button: any): void {
    button.state = !button.state; // Cambia el estado del botón
  }
}
