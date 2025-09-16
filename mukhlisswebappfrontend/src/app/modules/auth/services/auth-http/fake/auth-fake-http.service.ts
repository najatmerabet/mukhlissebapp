import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { UserModel } from '../../../models/user.model';
import { AuthModel } from '../../../models/auth.model';
import { UsersTable } from '../../../../../_fake/users.table';
import { environment } from '../../../../../../environments/environment';

const API_USERS_URL = `${environment.apiUrl}/users`;
const API_LOGIN_URL = `${environment.apiUrl}/login`;
const API_Me_URL = `${environment.apiUrl}/me`;
const API_REGISTER_URL = `${environment.apiUrl}/register`;
@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {
  constructor(private http: HttpClient) {}

  // public methods
   login(email: string, password: string): Observable<any> {
    if (!email || !password) {
      return of(new Error('Email and password are required'));
    }

    // Utiliser l'endpoint de login de votre backend Laravel
    const loginData = { email, password };
    
    return this.http.post<any>(API_LOGIN_URL, loginData).pipe(
      map((response) => {
        console.log('Login response from backend:', response);
        
        // Adapter la réponse de votre backend au modèle AuthModel
        // Votre backend retourne: { access_token: "...", token_type: "Bearer" }
        if (response && response.access_token) {
          const auth = new AuthModel();
          auth.authToken = response.access_token;
          
          console.log('authtoken stored',localStorage.getItem('authToken'));
          auth.refreshToken = `refresh-token-${Date.now()}`; // Généré côté client pour l'instant
          auth.expiresIn = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
          return auth;
        }
        
        throw new Error('Invalid credentials');
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return of(new Error('Login failed'));
      })
    );
  }

  createUser(user: UserModel): Observable<any> {
    // user.roles = [2]; // Manager
    // user.authToken = 'auth-token-' + Math.random();
    const registrationData = {
      name: user.fullname,
      email: user.email,
      password: user.password
    };
    console.log('registrationData', registrationData);
    return this.http.post<UserModel>(API_REGISTER_URL, registrationData);
  }

  forgotPassword(email: string): Observable<boolean> {
    return this.getAllUsers().pipe(
      map((result: UserModel[]) => {
        const user = result.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        return user !== undefined;
      })
    );
  }

  getUserByToken(token: string): Observable<any> {
   
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    localStorage.setItem('authToken', token);
     console.log('getUserByToken appele',token );
     console.log('authtoken',localStorage.getItem('authToken'));
    return this.http.get<any>(`${API_Me_URL}`, {
      headers: httpHeaders,
    });
  }

 getAllUsers(): Observable<UserModel[]> {
    console.log('🚀 getAllUsers - URL appelée:', API_USERS_URL);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.get<any[]>(API_USERS_URL, { headers }).pipe(
      tap(response => {
        console.log('✅ Réponse brute de l\'API:', response);
        console.log('🔍 Type de réponse:', typeof response);
        console.log('📋 Est un tableau?', Array.isArray(response));
        
        // Gérer le cas du double tableau
        if (Array.isArray(response) && response.length > 0 && Array.isArray(response[0])) {
          console.log('⚠️ Double tableau détecté, extraction du premier niveau');
        }
        
        console.log('📊 Nombre d\'utilisateurs:', response?.length || 0);
        
        if (response && response.length > 0) {
          response.forEach((user, index) => {
            console.log(`👤 Utilisateur ${index + 1}:`, user);
          });
        } else {
          console.log('⚠️ Aucun utilisateur trouvé dans la réponse');
        }
      }),
      map(response => {
        // Gérer le cas du double tableau [[[...]]] -> [[...]]
        if (Array.isArray(response) && response.length > 0 && Array.isArray(response[0])) {
          console.log('🔧 Correction du double tableau');
          return response[0] as UserModel[];
        }
        return response as UserModel[];
      }),
      
    );
  }
  private getFallbackUsers(): Observable<UserModel[]> {
    const fallbackUsers = [
      {
        id: 1,
        fullname: 'admin',
        password: 'demo',
        email: 'admin@demo.com',
        authToken: 'auth-token-fallback-1',
        refreshToken: 'refresh-token-fallback-1',
        //  roles: [1],
        // pic: './assets/media/avatars/300-1.jpg',
        // fullname: 'Admin User',
        // firstname: 'Admin',
        // lastname: 'User',
        // occupation: 'Administrator',
        // companyName: 'Demo Company',
        // phone: '123456789',
        // language: 'en',
        // timeZone: 'International Date Line West',
        // communication: { email: true, sms: false, phone: false },
        // address: { addressLine: '', city: '', state: '', postCode: '' },
        // socialNetworks: { linkedIn: '', facebook: '', twitter: '', instagram: '' }
      }
    ] as UserModel[];
    
    return of(fallbackUsers);
  }

}
