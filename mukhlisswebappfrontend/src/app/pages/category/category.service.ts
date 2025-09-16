import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

 getcategories(): Observable<any> {
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
   return this.http.get(`${this.apiUrl}/categoryget`, { headers });
 }

 addCategory(CategoryData:any): Observable<any> {
  const url = `${this.apiUrl}/categoryadd`;
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
   return this.http.post(`${this.apiUrl}/categoryadd`, CategoryData, { headers });
 }

 getCategoryById(id: number): Observable<any> {
  const url = `${this.apiUrl}/category/${id}`;
  const authToken = localStorage.getItem('authToken');
  if(!authToken) {
    console.error('No auth token found');
    return throwError('No authentication token available');
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
  });
  return this.http.get(url, { headers });
}

updateCategory(CategoryData:any): Observable<any>{
  const url = `${this.apiUrl}/categoryupdate/${CategoryData.id}`;
  const authToken = localStorage.getItem('authToken');
  if(!authToken) {
    console.error('No auth token found');
    return throwError('No authentication token available');
  }
   const headers = new HttpHeaders({
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
  });

  return this.http.post(url, CategoryData, { headers });
}

deleteCategory(id:number):Observable<any>{
 const url =`${this.apiUrl}/categorydelete/${id}`;
 const authToken = localStorage.getItem('authToken');
  if(!authToken) {
    console.error('No auth token found');
    return throwError('No authentication token available');
  }
   const headers = new HttpHeaders({
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
  });
  return this.http.delete(url, { headers });
}

 }


