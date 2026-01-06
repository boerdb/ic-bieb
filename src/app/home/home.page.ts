import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItemSliding,
  IonItem,
  IonLabel,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { FilePicker } from '@capawesome/capacitor-file-picker';

import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  documentAttachOutline,
  trash,
  add
} from 'ionicons/icons';

interface Manual {
  name: string;
  path: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,     // Fixt *ngIf en *ngFor
    FormsModule,
    IonHeader,        // Fixt <ion-header>
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonFab,
    IonFabButton
  ]
})
export class HomePage implements OnInit {
  manuals: Manual[] = [];
  STORAGE_KEY = 'my_manuals';

  constructor() {
    // Registreer iconen voor gebruik in HTML
    addIcons({
      documentTextOutline,
      documentAttachOutline,
      trash,
      add
    });
  }

  async ngOnInit() {
    await this.loadManuals();
  }

  async uploadFile() {
    try {
      const result = await FilePicker.pickFiles({
        types: ['application/pdf'],
        readData: true
      });

      const file = result.files[0];
      if (!file) return;

      const fileName = new Date().getTime() + '_' + file.name;

      // Opslaan (Web versie)
      await Filesystem.writeFile({
        path: fileName,
        data: file.data!,
        directory: Directory.Data,
      });

      const newManual: Manual = {
        name: file.name || 'Naamloze handleiding',
        path: fileName,
      };

      this.manuals.push(newManual);
      await this.saveList();

    } catch (error) {
      console.error('Fout bij uploaden:', error);
    }
  }

  async openManual(manual: Manual) {
    try {
      const readFile = await Filesystem.readFile({
        path: manual.path,
        directory: Directory.Data
      });

      const blob = this.base64ToBlob(readFile.data as string, 'application/pdf');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

    } catch (error) {
      console.error('Kan bestand niet openen', error);
      alert('Er ging iets mis bij het openen.');
    }
  }

  async deleteManual(index: number) {
    const manualToDelete = this.manuals[index];
    this.manuals.splice(index, 1);
    await this.saveList();

    try {
      await Filesystem.deleteFile({
        path: manualToDelete.path,
        directory: Directory.Data
      });
    } catch (e) {
      console.log('Fout bij verwijderen', e);
    }
  }

  async saveList() {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(this.manuals),
    });
  }

  async loadManuals() {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    if (value) {
      this.manuals = JSON.parse(value);
    }
  }

  base64ToBlob(base64: string, type: string) {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: type });
  }
}
