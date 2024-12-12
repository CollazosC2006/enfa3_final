import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private apiUrl = 'http://127.0.0.1:8000'; 

  constructor(private http: HttpClient) {}

  startApp(appName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/start-ryu`, { app_name: appName });
  }
  stopApp(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/stop-ryu`, {});
  }
}