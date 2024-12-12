import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable, Subject} from 'rxjs';
import { Socket } from 'ngx-socket-io';
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private socket: WebSocket | null = null;
  private messagesSubject: Subject<any> = new Subject<any>();

  constructor() {}

  // Método para conectar al WebSocket
  connect(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('Connected to WebSocket');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messagesSubject.next(data); // Emite los mensajes recibidos
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  // Método para obtener los mensajes
  getMessages(): Observable<any> {
    return this.messagesSubject.asObservable();
  }

  // Método para enviar datos
  sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // Método para cerrar la conexión
  closeConnection(): void {
    this.socket?.close();
  }
}
