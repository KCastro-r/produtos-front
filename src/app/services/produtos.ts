import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {
  private apiUrl = 'http://localhost:5027/api/Produtos';

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  criar(produto: { Nome: string; Preco: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl, produto);
  }

  atualizar(id: number, produto: { Id: number; Nome: string; Preco: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, produto);
  }

  remover(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}