import { Component, OnInit } from '@angular/core';
import { NetworkService } from '../services/network.service';
import { FlowsService } from '../services/flows.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flow-rules',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './flow-rules.component.html',
  styleUrls: ['./flow-rules.component.css'],
})
export class FlowRulesComponent implements OnInit {
  flowRules = ''; 
  switches: number[] = []; // Lista de switches obtenidos de la API
  selectedSwitch: number = 1; // Switch seleccionado
  rules: any[] = []; 

  constructor(private flowsService: FlowsService) {}

  ngOnInit() {
    this.loadSwitches();
  }

  // Método para cargar los switches desde el servicio
  loadSwitches() {
    this.flowsService.getSwitches().subscribe(
      (data) => {
        this.switches = data;
        this.selectedSwitch = this.switches[0]; // Establece el primer switch como seleccionado
        console.log('Switches obtenidos:', this.switches);
      },
      (error) => {
        console.error('Error al obtener los switches:', error);
      }
    );
  }

  obtener() {
    this.flowsService.getRules(this.selectedSwitch).subscribe(
      (data) => {
      let firstArray = Object.values(data)[0];  
        console.log('Reglas obtenidass:', firstArray);
      this.rules = firstArray;  

      },
      (error) => {
        console.error('Error al obtener las reglas:', error);
      }
    );
  }

  onSubmit() {
    try {
      const ruleJson = JSON.parse(this.flowRules);
  
      console.log('Formulario enviado con las reglas:', ruleJson);
      this.flowsService.addRule(ruleJson).subscribe(
        (data) => {
          console.log('Regla añadida:', data);
          this.obtener();
        },
        (error) => {
          console.error('Error al añadir la regla:', error);
        }
      );
    } catch (error) {
      console.error('Error al parsear el JSON de la regla:', error);
    }
  }
}
