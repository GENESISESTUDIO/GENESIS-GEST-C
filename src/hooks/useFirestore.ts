import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  QueryConstraint,
  DocumentData,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestore<T extends { id?: string; company_id?: string; project_id?: string }>(collectionPath: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const getCollection = useCallback((constraints: QueryConstraint[] = [], projectId?: string) => {
    if (!profile?.company_id) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Base constraints for multi-tenancy
    const baseConstraints: QueryConstraint[] = [
      where('company_id', '==', profile.company_id)
    ];

    // Optional project filtering
    if (projectId) {
      baseConstraints.push(where('project_id', '==', projectId));
    } else if (profile.role !== 'admin' && profile.role !== 'manager' && profile.accessible_projects?.length > 0) {
      // If not admin/manager and has restricted projects, filter by those
      baseConstraints.push(where('project_id', 'in', profile.accessible_projects));
    }

    const q = query(collection(db, collectionPath), ...baseConstraints, ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(`Error in onSnapshot for ${collectionPath}:`, err);
      setError(err.message);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, collectionPath);
    });

    return unsubscribe;
  }, [collectionPath, profile]);

  const add = async (item: Omit<T, 'id'>) => {
    if (!profile) throw new Error("Perfil do utilizador não carregado.");
    if (!profile.company_id || profile.company_id === 'pending') {
      throw new Error("A sua conta ainda não está associada a uma empresa ativa. Por favor, complete o seu registo ou aguarde aprovação.");
    }
    
    try {
      const dataWithCompany = {
        ...item,
        company_id: profile.company_id,
        created_at: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, collectionPath), dataWithCompany as DocumentData);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionPath);
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, item as DocumentData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionPath}/${id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionPath}/${id}`);
    }
  };

  return { data, loading, error, getCollection, add, update, remove };
}
