import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  private baseUrl = 'http://192.168.176.146:8080/v1.0/topology'; // Cambia <ryu-ip> por la IP de Ryu

  constructor(private http: HttpClient) {}

  getSwitches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/switches`);
  }

  getLinks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/links`);
  }

  getHosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/hosts`);
  }
}
