import { Injectable, signal, computed } from '@angular/core';
import { db, auth } from './firebase';
import { collection, doc, query, where, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

export type StatusScore = 'verde' | 'amarelo' | 'vermelho';

export interface UserProfile {
  id: string;
  email: string;
  createdAt: unknown;
  planType: 'trial' | 'anual' | 'vitalicio' | 'expired';
  subscriptionExpiresAt: string | null;
  paymentStatus: 'approved' | 'pending' | 'none';
  paymentEmail?: string | null;
  trialStartDate?: string | null;
}

export interface Jovem {
  id: string;
  userId: string;
  nome: string;
  idade: number;
  dataNascimento?: string | null;
  tamanhoChinelo?: string | null;
  tamanhoRoupa?: string | null;
  telefone: string | null;
  fotoUrl?: string | null;
  score: StatusScore;
  novoConvertido?: boolean;
  ultimaPresenca: string | null;
  dataCadastro: string;
  historicoPresenca: { eventoId: string; presente: boolean }[];
  jornada?: {
    visita: boolean;
    integracao: boolean;
    batismo: boolean;
    discipulado: boolean;
    servir: boolean;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MaterialDeEstudo {
  id: string;
  userId: string;
  titulo: string;
  descricao: string;
  tipo: 'pdf' | 'video' | 'artigo' | 'podcast';
  link: string;
  dataPublicacao: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Evento {
  id: string;
  userId: string;
  nome: string;
  data: string;
  realizado: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Transacao {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria?: string | null;
  data: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Igreja {
  id: string;
  userId: string;
  nome: string;
  endereco: string;
  telefone: string;
  instagram: string;
  logoUrl?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DiretoriaMember {
  id: string;
  userId: string;
  nome: string;
  cargo: string;
  fotoUrl?: string | null;
  createdAt?: unknown;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public jovens = signal<Jovem[]>([]);
  public eventos = signal<Evento[]>([]);
  public materiais = signal<MaterialDeEstudo[]>([]);
  public transacoes = signal<Transacao[]>([]);
  public diretoria = signal<DiretoriaMember[]>([]);
  public igreja = signal<Igreja | null>(null);
  public userProfile = signal<UserProfile | null>(null);

  public isSubscribed = computed(() => {
    const profile = this.userProfile();
    if (!profile) return true; // Evitar flickering durante o carregamento inicial

    if (profile.planType === 'vitalicio') return true;
    if (profile.planType === 'expired') return false;

    if (profile.planType === 'anual' || profile.planType === 'trial') {
      if (!profile.subscriptionExpiresAt) return true;
      const expires = new Date(profile.subscriptionExpiresAt).getTime();
      return expires > Date.now();
    }

    return false;
  });

  private unsubJovens?: () => void;
  private unsubEventos?: () => void;
  private unsubMateriais?: () => void;
  private unsubTransacoes?: () => void;
  private unsubDiretoria?: () => void;
  private unsubIgreja?: () => void;
  private unsubUserProfile?: () => void;

  constructor() {
    auth.onAuthStateChanged(user => {
      if (user) {
        this.subscribeToData(user.uid);
      } else {
        this.clearData();
      }
    });

    // Test connection as instructed in guidelines
    this.testConnection();
  }

  private async testConnection() {
    try {
      const { getDocFromServer } = await import('firebase/firestore');
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error: unknown) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  private subscribeToData(userId: string) {
    this.clearData();

    const userRef = doc(db, 'users', userId);
    this.unsubUserProfile = onSnapshot(userRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        this.userProfile.set({
          id: snapshot.id,
          email: data['email'] || '',
          createdAt: data['createdAt'] || null,
          planType: data['planType'] || 'trial',
          subscriptionExpiresAt: data['subscriptionExpiresAt'] || null,
          paymentStatus: data['paymentStatus'] || 'none',
          paymentEmail: data['paymentEmail'] || null,
          trialStartDate: data['trialStartDate'] || null
        } as UserProfile);
      } else {
        // Fallback robusto para usuários existentes que não têm o perfil de documento em si
        this.userProfile.set({
          id: userId,
          email: auth.currentUser?.email || '',
          createdAt: null,
          planType: 'trial',
          subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          paymentStatus: 'none',
          paymentEmail: auth.currentUser?.email || '',
          trialStartDate: new Date().toISOString()
        });
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    const jovensQuery = query(collection(db, 'jovens'), where('userId', '==', userId));
    this.unsubJovens = onSnapshot(jovensQuery, snapshot => {
      const result: Jovem[] = [];
      snapshot.forEach(doc => result.push({ id: doc.id, ...doc.data() } as Jovem));
      this.jovens.set(result);
    }, error => handleFirestoreError(error, OperationType.GET, 'jovens'));

    const eventosQuery = query(collection(db, 'eventos'), where('userId', '==', userId));
    this.unsubEventos = onSnapshot(eventosQuery, snapshot => {
      const result: Evento[] = [];
      snapshot.forEach(doc => result.push({ id: doc.id, ...doc.data() } as Evento));
      // order by date
      result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      this.eventos.set(result);
    }, error => handleFirestoreError(error, OperationType.GET, 'eventos'));

    const materiaisQuery = query(collection(db, 'materiais'), where('userId', '==', userId));
    this.unsubMateriais = onSnapshot(materiaisQuery, snapshot => {
      const result: MaterialDeEstudo[] = [];
      snapshot.forEach(doc => result.push({ id: doc.id, ...doc.data() } as MaterialDeEstudo));
      this.materiais.set(result);
    }, error => handleFirestoreError(error, OperationType.GET, 'materiais'));

    const transacoesQuery = query(collection(db, 'transacoes'), where('userId', '==', userId));
    this.unsubTransacoes = onSnapshot(transacoesQuery, snapshot => {
      const result: Transacao[] = [];
      snapshot.forEach(doc => result.push({ id: doc.id, ...doc.data() } as Transacao));
      // order by date
      result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      this.transacoes.set(result);
    }, error => handleFirestoreError(error, OperationType.GET, 'transacoes'));

    const diretoriaQuery = query(collection(db, 'diretoria'), where('userId', '==', userId));
    this.unsubDiretoria = onSnapshot(diretoriaQuery, snapshot => {
      const result: DiretoriaMember[] = [];
      snapshot.forEach(doc => result.push({ id: doc.id, ...doc.data() } as DiretoriaMember));
      this.diretoria.set(result);
    }, error => handleFirestoreError(error, OperationType.GET, 'diretoria'));

    const igrejaQuery = query(collection(db, 'igrejas'), where('userId', '==', userId));
    this.unsubIgreja = onSnapshot(igrejaQuery, snapshot => {
      if (!snapshot.empty) {
        this.igreja.set({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Igreja);
      } else {
        this.igreja.set(null);
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'igrejas'));
  }

  private clearData() {
    if (this.unsubJovens) this.unsubJovens();
    if (this.unsubEventos) this.unsubEventos();
    if (this.unsubMateriais) this.unsubMateriais();
    if (this.unsubTransacoes) this.unsubTransacoes();
    if (this.unsubDiretoria) this.unsubDiretoria();
    if (this.unsubIgreja) this.unsubIgreja();
    if (this.unsubUserProfile) this.unsubUserProfile();
    this.jovens.set([]);
    this.eventos.set([]);
    this.materiais.set([]);
    this.transacoes.set([]);
    this.diretoria.set([]);
    this.igreja.set(null);
    this.userProfile.set(null);
  }

  public totalJovens = computed(() => this.jovens().length);
  public totalEngajados = computed(() => this.jovens().filter(j => j.score === 'verde').length);
  public totalAlerta = computed(() => this.jovens().filter(j => j.score === 'amarelo').length);
  public totalCritico = computed(() => this.jovens().filter(j => j.score === 'vermelho').length);

  public jovensEmRisco = computed(() => {
    return this.jovens()
      .filter(j => j.score === 'vermelho' || j.score === 'amarelo')
      .sort(a => a.score === 'vermelho' ? -1 : 1);
  });

  public getAniversarioDia(data: string | null | undefined): string {
    if (!data) return '--';
    const parts = data.split('-');
    if (parts.length !== 3) return '--';
    return parts[2].padStart(2, '0');
  }

  public aniversariantes = computed(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    
    return this.jovens()
      .filter(j => {
        if (!j.dataNascimento) return false;
        // Parse YYYY-MM-DD manually to avoid timezone/UTC issues
        const parts = j.dataNascimento.split('-');
        if (parts.length !== 3) return false;
        const mesNasc = parseInt(parts[1], 10) - 1; // 0-indexed
        return mesNasc === mesAtual;
      })
      .sort((a, b) => {
        const diaA = parseInt(a.dataNascimento!.split('-')[2], 10);
        const diaB = parseInt(b.dataNascimento!.split('-')[2], 10);
        return diaA - diaB;
      });
  });

  public totalSaidas = computed(() => {
    return this.transacoes()
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
  });

  public saldoGeral = computed(() => this.totalEntradas() - this.totalSaidas());

  async addJovem(jovem: Omit<Jovem, 'id' | 'historicoPresenca' | 'dataCadastro' | 'userId' | 'ultimaPresenca'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const newRef = doc(collection(db, 'jovens'));
      const newJovem = {
        userId,
        nome: jovem.nome,
        idade: jovem.idade,
        dataNascimento: jovem.dataNascimento || null,
        tamanhoChinelo: jovem.tamanhoChinelo || null,
        tamanhoRoupa: jovem.tamanhoRoupa || null,
        telefone: jovem.telefone || null,
        fotoUrl: jovem.fotoUrl || null,
        score: jovem.score,
        novoConvertido: jovem.novoConvertido || false,
        ultimaPresenca: null,
        dataCadastro: new Date().toISOString(),
        historicoPresenca: [],
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, newJovem);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'jovens');
    }
  }

  async updateJovem(id: string, updates: Partial<Jovem>) {
    try {
      const dataToUpdate = { ...updates, updatedAt: serverTimestamp() };
      delete dataToUpdate.id; // avoid writing id to document
      await updateDoc(doc(db, 'jovens', id), dataToUpdate);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'jovens');
    }
  }

  async deleteJovem(id: string) {
    try {
      await deleteDoc(doc(db, 'jovens', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'jovens');
    }
  }

  async saveIgreja(igrejaData: Omit<Igreja, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (this.igreja()?.id) {
        // Update
        const dataToUpdate = { ...igrejaData, updatedAt: serverTimestamp() };
        await updateDoc(doc(db, 'igrejas', this.igreja()!.id), dataToUpdate);
      } else {
        // Create
        const newRef = doc(collection(db, 'igrejas'));
        const newIgreja = {
          userId,
          ...igrejaData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(newRef, newIgreja);
      }
    } catch (err) {
      const type = this.igreja()?.id ? OperationType.UPDATE : OperationType.CREATE;
      handleFirestoreError(err, type, 'igrejas');
    }
  }

  async addEvento(nome: string, data: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const newRef = doc(collection(db, 'eventos'));
      const newEvento = {
        userId,
        nome,
        data,
        realizado: false,
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, newEvento);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'eventos');
    }
  }

  async registrarPresenca(eventoId: string, presencas: Record<string, boolean>) {
    const batch = writeBatch(db);
    try {
      const evento = this.eventos().find(e => e.id === eventoId);
      if (!evento) return;

      const jovens = this.jovens();
      for (const j of jovens) {
        const presente = !!presencas[j.id];
        const historico = [...j.historicoPresenca.filter(h => h.eventoId !== eventoId), { eventoId, presente }];
        
        let score: StatusScore = j.score;
        const presentesHist = historico.filter(h => h.presente).length;
        if (historico.length >= 2) {
            if (presentesHist === 0) score = 'vermelho';
            else if (presentesHist === historico.length) score = 'verde';
            else score = 'amarelo';
        }

        const ultimaPresenca = presente ? evento.data : j.ultimaPresenca || null;

        const jovemRef = doc(db, 'jovens', j.id);
        batch.update(jovemRef, {
          historicoPresenca: historico,
          score,
          ultimaPresenca,
          updatedAt: serverTimestamp()
        });
      }

      const eventoRef = doc(db, 'eventos', eventoId);
      batch.update(eventoRef, {
        realizado: true,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'batch');
    }
  }

  public totalEntradas = computed(() => {
    return this.transacoes()
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
  });

  async addTransacao(transacao: Omit<Transacao, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const newRef = doc(collection(db, 'transacoes'));
      const newTransacao = {
        userId,
        ...transacao,
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, newTransacao);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'transacoes');
    }
  }

  async deleteTransacao(id: string) {
    try {
      await deleteDoc(doc(db, 'transacoes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'transacoes');
    }
  }

  async addDiretoriaMember(membro: Omit<DiretoriaMember, 'id' | 'userId' | 'createdAt'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const newRef = doc(collection(db, 'diretoria'));
      const newMember = {
        userId,
        ...membro,
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, newMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'diretoria');
    }
  }

  async deleteDiretoriaMember(id: string) {
    console.log('DataService: deleting member with id:', id);
    try {
      await deleteDoc(doc(db, 'diretoria', id));
    } catch (err) {
      console.error('DataService: error deleting member', err);
      handleFirestoreError(err, OperationType.DELETE, 'diretoria');
    }
  }

  async updateSubscription(planType: 'trial' | 'anual' | 'vitalicio' | 'expired', paymentStatus: 'approved' | 'pending' | 'none', paymentEmail: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      let expiresAt: string | null = null;
      if (planType === 'anual') {
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 ano
      } else if (planType === 'trial') {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias
      } else if (planType === 'expired') {
        expiresAt = new Date(Date.now() - 60000).toISOString(); // expirado há 1 minuto
      }

      await updateDoc(userRef, {
        planType,
        paymentStatus,
        paymentEmail: paymentEmail || null,
        subscriptionExpiresAt: expiresAt,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  }
}
