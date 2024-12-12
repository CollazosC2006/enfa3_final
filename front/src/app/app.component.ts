import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgFor, NgStyle } from '@angular/common';
import { FlowRulesComponent } from "./flow-rules/flow-rules.component";
import { ExamplesComponent } from './examples/examples.component';
import { NetworkGraphComponent } from './network-graph/network-graph.component';
import { FormsModule } from '@angular/forms';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, NgStyle, NgFor, FlowRulesComponent,FlowRulesComponent,ExamplesComponent,NetworkGraphComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'enfa3_final';
  selectedApp: string = '';
  networkApps = [
    { label: 'Simple Switch', value: 'simple_switch.py'},
    { label: 'Simple Switch v1.3', value: 'simple_switch_13.py' },
    { label: 'Simple Switch stp', value: 'simple_switch_stp.py' },
    { label: 'App 4', value: 'simple_switch_stp_13.py' },
  ];

  buttons = [
    { label: 'Botón 1', state: false, color: '#28a745' },
    { label: 'Botón 2', state: false, color: '#007bff' },
    { label: 'Botón 3', state: false, color: '#ffc107' },
    { label: 'Botón 4', state: false, color: '#dc3545' },
    { label: 'Botón 5', state: false, color: '#17a2b8' },
  ];

  constructor(private appService: AppService) {}

  startApp(): void {
    console.log('Starting app:', this.selectedApp);
    if (this.selectedApp) {
      this.appService.startApp(this.selectedApp).subscribe(
        (response) => {
          console.log('App started:', response);
        },
        (error) => {
          console.error('Error starting app:', error);
        }
      );
    } else {
      console.warn('No app selected');
    }
  }

  stopApp(): void {
    this.appService.stopApp().subscribe(
      (response) => {
        console.log('App stopped:', response);
      },
      (error) => {
        console.error('Error stopping app:', error);
      }
    );
  }
}
