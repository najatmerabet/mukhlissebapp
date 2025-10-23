import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as wkx from 'wkx';
@Injectable({
  providedIn: 'root'
})
export class MagazinService {
 
  constructor(private http: HttpClient) { }

  private apiUrl = `${environment.apiUrl}`;

  //get all magazin 
 getmagazins(): Observable<any> {
  const url = `${this.apiUrl}/magazinget`;
  console.log('Fetching magazins from:', url);
  
  // Check if token exists and is valid
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

getmagazinById(id: number): Observable<any> {
  const url = `${this.apiUrl}/magazin/${id}`;
  console.log('Fetching magazin details from:', url);

  const authToken = localStorage.getItem('authToken');
  console.log('Auth token:', authToken);
  if (!authToken) {
    console.error('No auth token found');
    return throwError('No authentication token available');
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
  });

  return this.http.get(url, { headers }).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorage.removeItem('authToken');
      }
      return throwError(error);
    })
  );
}

addmagazin(magazinData: any): Observable<any> {
  const url = `${this.apiUrl}/magazinadd`;
  console.log('Adding magazin to:', url);

  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    console.error('No auth token found');
    return throwError('No authentication token available');
  }

  // Check if magazinData is FormData
  if (magazinData instanceof FormData) {
    console.log('Sending FormData directly');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json'
      // DON'T set Content-Type for FormData - let browser set it with boundary
    });

    // Create geometry from latitude and longitude if they exist
   

    // Log FormData contents for debugging
    console.log('=== FORMDATA CONTENTS ===');
    for (let [key, value] of (magazinData as any).entries()) {
      console.log(key + ': ', value);
    }
    console.log('========================');

    return this.http.post(url, magazinData, { headers }).pipe(
      catchError(error => {
        console.error('Erreur détaillée:', error);
        if (error.status === 401) {
          localStorage.removeItem('authToken');
        }
        return throwError(error);
      })
    );
  } else {
    // Fallback for regular object data
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    // const transformedData = this.transformDataForGeometry(magazinData);
    // console.log('Données transformées COMPLÈTES:', JSON.stringify(transformedData, null, 2));

    return this.http.post(url, magazinData, { headers }).pipe(
      catchError(error => {
        console.error('Erreur détaillée:', error);
        if (error.status === 401) {
          localStorage.removeItem('authToken');
        }
        return throwError(error);
      })
    );
  }
}

 private transformDataForGeometry(data: any): any {
    const transformedData = { ...data };

    // Créer une géométrie au format WKB hexadécimal (string)
    if (data.latitude && data.longitude) {
      // Convertir les coordonnées en format WKB hexadécimal
      transformedData.geom = this.createPointWKBHex(
        parseFloat(data.longitude), 
        parseFloat(data.latitude)
      );
      
      // Supprimer les champs latitude et longitude si l'API ne les attend pas
      delete transformedData.latitude;
      delete transformedData.longitude;
    }

    // S'assurer que la catégorie est correctement formatée
    if (data.category && typeof data.category === 'object') {
      transformedData.category_id = data.category.id;
      transformedData.category_name = data.category.nameFr;
    }
console.log('Transformed Data for Geometry:', transformedData);
    return transformedData;
  }


  // Méthode utilitaire pour créer une géométrie Point
  createPointGeometry(latitude: number, longitude: number): any {
    return {
      type: 'Point',
      coordinates: [longitude, latitude] // Attention : longitude d'abord, puis latitude
    };
  }

  private createPointWKBHex(longitude: number, latitude: number): string {
    
    const byteOrder = '01';
    const wkbType = '01000000'; 
    const srid = '461E0000'; // 461E0000 -> 00001E46 -> 7750? Correction nécessaire
    const sridCorrect = '10270000'; // 00002710 = 10000? Non, essayons autre chose
    const srid4326 = '10270000'; // En little endian: 00 00 27 10 -> 0x00001027 = 4135? 
    const sridPostgis = 'E6100000'; // Big endian, mais nous devons l'écrire en little endian
    const byteOrderNoSrid = '01';
    const wkbTypeNoSrid = '01000000'; // Point (1) sans SRID
    const longBuffer = this.float64ToHexLe(longitude);
    const latBuffer = this.float64ToHexLe(latitude);
    
    // Format sans SRID (plus simple)
    return byteOrderNoSrid + wkbTypeNoSrid + longBuffer + latBuffer;
  }

  // Convertir un nombre flottant 64 bits en hexadécimal little endian
  private float64ToHexLe(value: number): string {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, true); // true pour little endian
    
    const hexParts = [];
    for (let i = 0; i < 8; i++) {
      const byte = view.getUint8(i);
      hexParts.push(byte.toString(16).padStart(2, '0'));
    }
    
    return hexParts.join('');
  }

  // update magazin 
UpdateMagazin(magazinData: any | FormData): Observable<any> {
  let magazinId: string;
  let url: string;
  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    return throwError('User not authenticated');
  }

  // Cas 1: Données envoyées via FormData (avec fichier)
  if (magazinData instanceof FormData) {
    // Extraire l'ID du FormData
    magazinId = magazinData.get('id') as string;
    console.log('magazin id est (FormData):', magazinId);
    url = `${this.apiUrl}/magazinupdate/${magazinId}`;

    return this.http.post(url, magazinData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
        // Pas de Content-Type pour FormData (le navigateur le gère)
      }
    });
  } 
  // Cas 2: Données envoyées via JSON (sans fichier)
  else {
    magazinId = magazinData.id;
    console.log('magazin id est (JSON):', magazinId);
    url = `${this.apiUrl}/magazinupdate/${magazinId}`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(url, magazinData, { headers });
  }
}

//delete magazin
deletemagazin(id:string):Observable<any>{
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    return throwError('User not authenticated');
  }

  const url = `${this.apiUrl}/magazindelete/${id}`;
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  return this.http.delete(url, { headers });
}

}
