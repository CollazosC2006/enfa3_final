import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlowsService {

  private apiUrl = 'http://127.0.0.1:8000'; 

  constructor(private http: HttpClient) {}

  getSwitches(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/switchesinfo`);
  }
  getRules(switchId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats/flow/${switchId}`);
}
addRule(rule: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/stats/flow`, rule);
}
}