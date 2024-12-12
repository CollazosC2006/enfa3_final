import { Component, OnInit, ElementRef} from '@angular/core';
import { NetworkService } from '../services/network.service';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';


@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [],
  templateUrl: './network-graph.component.html',
  styleUrl: './network-graph.component.css'
})


export class NetworkGraphComponent implements OnInit {

  

  private socket: WebSocket | null = null;

  constructor(
    private networkService: NetworkService,
    private el: ElementRef,
    
  ) {}

  ngOnInit(): void {
    this.loadTopology(); 
  }


  

  loadTopology(): void {
    // Solicitar los datos de la topología
    Promise.all([
      this.networkService.getSwitches().toPromise(),
      this.networkService.getLinks().toPromise(),
      this.networkService.getHosts().toPromise(),
    ]).then(([switches, links, hosts]) => {
      this.renderGraph(switches || [], links || [], hosts || []);
    });
  }

  renderGraph(
    switches: any[],
    links: any[],
    hosts: any[]
  ): void {
    const width = 960;
    const height = 600;
  
    d3.select(this.el.nativeElement.querySelector('#networkGraph')).selectAll('*').remove();
    const svg = d3
      .select(this.el.nativeElement.querySelector('#networkGraph'))
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  
    type NetworkNode = SimulationNodeDatum & { id: any; type: string; ip?: string };
    type NetworkLink = SimulationLinkDatum<NetworkNode> & {
      srcPort: string;
      dstPort: string;
    };
  
    const nodes: NetworkNode[] = [
      ...switches.map((sw) => ({ id: sw.dpid, type: 'switch' })),
    ];
  
    // Obtener lista de DPIDs válidos de los switches
    const validSwitchDpids = nodes.map((node) => node.id);
  
    // Filtrar los hosts que estén conectados a switches existentes
    const validHosts = hosts.filter((host) => validSwitchDpids.includes(host.port.dpid));
  
    // Añadir los hosts filtrados a la lista de nodos
    nodes.push(
      ...validHosts.map((host) => ({
        id: host.mac,
        ip: host.ipv4[0],
        type: 'host',
      }))
    );
  
    // Crear enlaces entre switches y entre hosts y switches
    const linkData: NetworkLink[] = [
      ...links
        .filter((link) => validSwitchDpids.includes(link.src.dpid) && validSwitchDpids.includes(link.dst.dpid))
        .map((link) => ({
          source: link.src.dpid,
          target: link.dst.dpid,
          srcPort: link.src.name,
          dstPort: link.dst.name,
        })),
      ...validHosts.map((host) => ({
        source: host.port.dpid,
        target: host.mac,
        srcPort: host.port.name,
        dstPort: '', // Los hosts no tienen un puerto adicional
      })),
    ];
  
    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        'link',
        d3.forceLink<NetworkNode, NetworkLink>(linkData).id((d) => d.id).distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30)); // Evitar superposición de nodos
  
    const link = svg
      .selectAll<SVGLineElement, NetworkLink>('line')
      .data(linkData)
      .enter()
      .append('line')
      .style('stroke', '#aaa')
      .style('stroke-width', 2);
  
    const node = svg
      .selectAll<SVGGElement, NetworkNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );
  
    // Añadir nodos
    node
      .append('image')
      .attr('xlink:href', (d) =>
        d.type === 'switch'
          ? '/switch.svg' // Ruta a la imagen del switch
          : '/host.svg'   // Ruta a la imagen del host
      )
      .attr('x', -20) // Centrar la imagen horizontalmente
      .attr('y', -20) // Centrar la imagen verticalmente
      .attr('width', (d) => (d.type === 'switch' ? 60 : 35)) // Ancho de la imagen
      .attr('height', (d) => (d.type === 'switch' ? 60 : 35)); // Altura de la imagen
  
    // Añadir etiquetas para nodos
    node
      .append('text')
      .attr('dx', (d) => {
        if (d.x! < 40) return 20;
        if (d.x! > width - 40) return -20;
        return 0;
      })
      .attr('dy', (d) => {
        if (d.y! < 40) return 30;
        if (d.y! > height - 40) return -10;
        return -25;
      })
      .text((d) =>
        d.type === 'switch'
          ? `Switch: ${formatDpid(d.id)}`
          : `Host: ${d.ip || d.id}`
      )
      .style('font-size', '12px')
      .style('text-anchor', 'middle');

    const port = svg
      .selectAll<SVGGElement, NetworkLink>('g.port')
      .data(linkData)
      .enter()
      .append('g')
      .attr('class', 'port');
      
    port
      .append('circle')
      .attr('r', 10)
      .attr('fill', '#FFD700')
      .style('stroke', '#000');
        

    port
      .append('text')
      .attr('dx', 0) // Sin desplazamiento horizontal
      .attr('dy', 3) // Ajuste vertical para centrar mejor dentro del círculo
      .style('font-size', '8px') // Tamaño adecuado para que el texto encaje en el círculo
      .style('text-anchor', 'middle') // Centrado horizontal
      .style('dominant-baseline', 'middle'); // Centrado vertical

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => Math.max(20, Math.min(width - 20, (d.source as NetworkNode).x!)))
        .attr('y1', (d) => Math.max(20, Math.min(height - 20, (d.source as NetworkNode).y!)))
        .attr('x2', (d) => Math.max(20, Math.min(width - 20, (d.target as NetworkNode).x!)))
        .attr('y2', (d) => Math.max(20, Math.min(height - 20, (d.target as NetworkNode).y!)));
        
      node.attr('transform', (d) => {
        d.x = Math.max(20, Math.min(width - 20, d.x!));
        d.y = Math.max(20, Math.min(height - 20, d.y!));
        return `translate(${d.x},${d.y})`;
      });

      port.each(function (d) {
        const g = d3.select(this);
        
        // Coordenadas del nodo fuente (source) y destino (target)
        const x1 = (d.source as NetworkNode).x!;
        const y1 = (d.source as NetworkNode).y!;
        const x2 = (d.target as NetworkNode).x!;
        const y2 = (d.target as NetworkNode).y!;
        
        // Calcular la dirección del enlace
        const angle = Math.atan2(y2 - y1, x2 - x1); // Ángulo de la línea
        const offset = 20; // Distancia del puerto al nodo
        
        // Posicionar puerto en el extremo del nodo fuente
        const srcX = x1 + offset * Math.cos(angle);
        const srcY = y1 + offset * Math.sin(angle);
        g.select('circle')
          .filter((_, i) => i % 2 === 0) // Círculo del puerto fuente
          .attr('cx', srcX)
          .attr('cy', srcY);
        
        g.select('text')
          .filter((_, i) => i % 2 === 0) // Texto del puerto fuente
          .text(() => formatPortName(d.srcPort))
          .attr('x', srcX)
          .attr('y', srcY);
        
        // Posicionar puerto en el extremo del nodo destino
        const dstX = x2 - offset * Math.cos(angle);
        const dstY = y2 - offset * Math.sin(angle);
        g.select('circle')
          .filter((_, i) => i % 2 === 1) // Círculo del puerto destino
          .attr('cx', dstX)
          .attr('cy', dstY);
        
        g.select('text')
          .filter((_, i) => i % 2 === 1) // Texto del puerto destino
          .text(() => formatPortName(d.dstPort))
          .attr('x', dstX)
          .attr('y', dstY);
      });
    
    });
  }

}

function formatPortName(portName: string): string {
  const parts = portName.split('-'); // Dividir la cadena por el guion
  return parts[1] || portName; // Devolver la segunda parte o la original si no hay guion
}

function formatDpid(dpid: string): string {
  // Convierte el DPID a un número entero eliminando los ceros iniciales
  return parseInt(dpid, 10).toString();
}