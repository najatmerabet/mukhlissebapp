import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ClientService {
 private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getClients():Observable<any>{
      const url = `${this.apiUrl}/allclients`;

    const authToken = localStorage.getItem('authToken');
      console.log('Auth token:', authToken);
      if (!authToken) {
        console.error('No auth token found');
        // Handle missing token (redirect to login, etc.)
        return throwError('No authentication token available');
      }
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      });
    
      return this.http.get(url, { headers }).pipe(
        catchError(error => {
          if (error.status === 401) {
            // Token might be expired or invalid
            localStorage.removeItem('authToken');
            // Redirect to login or refresh token
          }
          return throwError(error);
        })
      );
  }

}
