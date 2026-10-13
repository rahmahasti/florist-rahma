import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_COLLECTION = 'products';

// Seed initial 12 products if the Firestore collection is empty
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snapshot.empty) {
      console.log('Produk Firestore kosong. Melakukan inisialisasi 12 produk awal...');
      for (let i = 0; i < INITIAL_PRODUCTS.length; i++) {
        const prod = INITIAL_PRODUCTS[i];
        const docRef = doc(db, PRODUCTS_COLLECTION, `prod-${i + 1}`);
        await setDoc(docRef, {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      console.log('Berhasil menginisialisasi 12 produk bunga ke real database Firestore!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
  }
}

// Real-time listener for products collection
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        products.push({
          id: docSnapshot.id,
          name: data.name || '',
          category: data.category || 'Buket Bunga',
          price: Number(data.price) || 0,
          stock: Number(data.stock) || 0,
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          rating: Number(data.rating) || 5.0,
          soldCount: Number(data.soldCount) || 0,
          isFeatured: Boolean(data.isFeatured),
          tag: data.tag || '',
          flowerTypes: data.flowerTypes || [],
          dimensions: data.dimensions || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      // Sort by creation or ID to maintain consistent display
      products.sort((a, b) => {
        if (a.id.startsWith('prod-') && b.id.startsWith('prod-')) {
          const numA = parseInt(a.id.replace('prod-', ''), 10);
          const numB = parseInt(b.id.replace('prod-', ''), 10);
          return numA - numB;
        }
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      onSuccess(products);
    },
    (error) => {
      console.error('Error subscribing to products:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );

  return unsubscribe;
}

// Update single product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

// Fast inline stock adjustment
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      stock: Math.max(0, newStock),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

// Add new product
export async function addProduct(productData: Omit<Product, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

// Reset / Re-seed 12 products
export async function resetToDefault12Products(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    for (const docItem of snapshot.docs) {
      await deleteDoc(docItem.ref);
    }
    for (let i = 0; i < INITIAL_PRODUCTS.length; i++) {
      const prod = INITIAL_PRODUCTS[i];
      const docRef = doc(db, PRODUCTS_COLLECTION, `prod-${i + 1}`);
      await setDoc(docRef, {
        ...prod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
  }
}
