import { Component, OnInit, ElementRef } from '@angular/core';
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
export class NetworkGraphComponent {
  constructor(
    private networkService: NetworkService,
    private el: ElementRef
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

    const svg = d3
      .select(this.el.nativeElement.querySelector('#networkGraph'))
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    type NetworkNode = SimulationNodeDatum & { id: any; type: string; ip?: string };
    type NetworkLink = SimulationLinkDatum<NetworkNode>;

    const nodes: NetworkNode[] = [
      ...switches.map((sw) => ({ id: sw.dpid, type: 'switch' })),
      ...hosts.map((host) => ({
        id: host.mac,
        ip: host.ipv4[0],
        type: 'host'
      })),
    ];

    const linkData: NetworkLink[] = links.map((link) => ({
      source: link.src.dpid,
      target: link.dst.dpid,
    }));

    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        'link',
        d3.forceLink<NetworkNode, NetworkLink>(linkData).id((d) => d.id).distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

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

    // Añadir círculos para nodos
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) =>
        d.type === 'switch' ? '#007bff' : '#28a745'
      );

    // Añadir etiquetas para nodos
    node
      .append('text')
      .attr('dy', -25)
      .attr('dx', -20)
      .text((d) =>
        d.type === 'switch' ? `Switch: ${d.id}` : `Host: ${d.ip || d.id}`
      )
      .style('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NetworkNode).x!)
        .attr('y1', (d) => (d.source as NetworkNode).y!)
        .attr('x2', (d) => (d.target as NetworkNode).x!)
        .attr('y2', (d) => (d.target as NetworkNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  }
}
