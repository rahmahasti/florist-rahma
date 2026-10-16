import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  runTransaction,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PosTransaction, InventoryLog, Product, Customer } from '../types';

const POS_COLLECTION = 'pos_transactions';
const INVENTORY_LOGS_COLLECTION = 'inventory_logs';
const PRODUCTS_COLLECTION = 'products';
const CUSTOMERS_COLLECTION = 'customers';

// Generate receipt number like POS-FLR-20261014-8421
export function generateReceiptNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `POS-FLR-${dateStr}-${randomSuffix}`;
}

// Complete a POS checkout transaction with real Firestore atomic updates
export async function processPosTransaction(
  txData: Omit<PosTransaction, 'id'>
): Promise<string> {
  try {
    let newTxId = '';

    await runTransaction(db, async (transaction) => {
      // 1. Verify and deduct product stocks
      for (const item of txData.items) {
        const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodDoc = await transaction.get(prodRef);

        if (prodDoc.exists()) {
          const currentData = prodDoc.data();
          const currentStock = Number(currentData.stock) || 0;
          const currentSoldCount = Number(currentData.soldCount) || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          transaction.update(prodRef, {
            stock: newStock,
            soldCount: currentSoldCount + item.quantity,
            updatedAt: new Date().toISOString(),
          });

          // Create inventory log doc reference
          const logRef = doc(collection(db, INVENTORY_LOGS_COLLECTION));
          transaction.set(logRef, {
            productId: item.productId,
            productSku: item.sku || '',
            productName: item.productName,
            type: 'out',
            quantityChange: -item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            notes: `Penjualan POS #${txData.receiptNumber} (${txData.paymentMethod})`,
            staffName: txData.cashierName || 'Kasir Floristique',
            costPriceAtTime: item.costPrice || 0,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 2. Insert POS transaction record
      const posTxRef = doc(collection(db, POS_COLLECTION));
      newTxId = posTxRef.id;
      transaction.set(posTxRef, {
        ...txData,
        createdAt: new Date().toISOString(),
      });

      // 3. Sync customer if customer name is not generic walk-in
      if (txData.customerName && txData.customerName !== 'Pelanggan Umum / Walk-in') {
        const custId = txData.customerPhone 
          ? `cust-${txData.customerPhone.replace(/\D/g, '')}` 
          : `cust-${txData.customerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        const custRef = doc(db, CUSTOMERS_COLLECTION, custId);
        const custDoc = await transaction.get(custRef);

        if (custDoc.exists()) {
          const cd = custDoc.data();
          transaction.update(custRef, {
            name: txData.customerName,
            phone: txData.customerPhone || cd.phone || '',
            totalOrders: (Number(cd.totalOrders) || 0) + 1,
            totalSpent: (Number(cd.totalSpent) || 0) + txData.totalAmount,
            lastOrderDate: new Date().toISOString(),
          });
        } else {
          transaction.set(custRef, {
            name: txData.customerName,
            email: '-',
            phone: txData.customerPhone || '-',
            address: 'Transaksi Kasir POS Toko',
            totalOrders: 1,
            totalSpent: txData.totalAmount,
            lastOrderDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    return newTxId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, POS_COLLECTION);
    throw error;
  }
}

// Real-time listener for POS Transactions
export function subscribeToPosTransactions(
  onSuccess: (transactions: PosTransaction[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, POS_COLLECTION));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions: PosTransaction[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        transactions.push({
          id: docSnapshot.id,
          receiptNumber: data.receiptNumber || 'POS-UNKNOWN',
          cashierName: data.cashierName || 'Kasir',
          customerName: data.customerName || 'Pelanggan Walk-in',
          customerPhone: data.customerPhone || '',
          items: data.items || [],
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          totalAmount: Number(data.totalAmount) || 0,
          totalCost: Number(data.totalCost) || 0,
          profitAmount: Number(data.profitAmount) || 0,
          profitRatio: Number(data.profitRatio) || 0,
          paymentMethod: data.paymentMethod || 'Tunai',
          amountTendered: Number(data.amountTendered) || 0,
          changeAmount: Number(data.changeAmount) || 0,
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort newest first
      transactions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onSuccess(transactions);
    },
    (error) => {
      console.error('Error subscribing to POS transactions:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, POS_COLLECTION);
    }
  );

  return unsubscribe;
}

// Real-time listener for Inventory Logs / Mutation Cards
export function subscribeToInventoryLogs(
  onSuccess: (logs: InventoryLog[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, INVENTORY_LOGS_COLLECTION),
    (snapshot) => {
      const logs: InventoryLog[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        logs.push({
          id: docSnapshot.id,
          productId: data.productId || '',
          productSku: data.productSku || '',
          productName: data.productName || 'Bunga',
          type: data.type || 'in',
          quantityChange: Number(data.quantityChange) || 0,
          previousStock: Number(data.previousStock) || 0,
          newStock: Number(data.newStock) || 0,
          notes: data.notes || '',
          staffName: data.staffName || 'Staff',
          costPriceAtTime: Number(data.costPriceAtTime) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort newest mutation first
      logs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onSuccess(logs);
    },
    (error) => {
      console.error('Error subscribing to inventory logs:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, INVENTORY_LOGS_COLLECTION);
    }
  );

  return unsubscribe;
}

// Record Restock (Barang Masuk) with optional cost price update
export async function recordRestock(
  productId: string,
  qtyAdded: number,
  newCostPrice: number | undefined,
  notes: string,
  staffName: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const prodRef = doc(db, PRODUCTS_COLLECTION, productId);
      const prodDoc = await transaction.get(prodRef);

      if (!prodDoc.exists()) {
        throw new Error('Produk tidak ditemukan!');
      }

      const prodData = prodDoc.data();
      const currentStock = Number(prodData.stock) || 0;
      const updatedStock = currentStock + Math.max(1, qtyAdded);

      const updates: any = {
        stock: updatedStock,
        updatedAt: new Date().toISOString(),
      };

      if (newCostPrice !== undefined && newCostPrice > 0) {
        updates.costPrice = newCostPrice;
      }

      transaction.update(prodRef, updates);

      // Create log
      const logRef = doc(collection(db, INVENTORY_LOGS_COLLECTION));
      transaction.set(logRef, {
        productId: productId,
        productSku: prodData.sku || '',
        productName: prodData.name || 'Produk',
        type: 'in',
        quantityChange: qtyAdded,
        previousStock: currentStock,
        newStock: updatedStock,
        notes: notes || 'Restock pengadaan bunga baru',
        staffName: staffName || 'Admin Inventory',
        costPriceAtTime: newCostPrice || prodData.costPrice || 0,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, INVENTORY_LOGS_COLLECTION);
    throw error;
  }
}

// Record Stock Opname (Penyesuaian Fisik)
export async function recordStockOpname(
  productId: string,
  actualPhysicalStock: number,
  reason: string,
  staffName: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const prodRef = doc(db, PRODUCTS_COLLECTION, productId);
      const prodDoc = await transaction.get(prodRef);

      if (!prodDoc.exists()) {
        throw new Error('Produk tidak ditemukan!');
      }

      const prodData = prodDoc.data();
      const currentStock = Number(prodData.stock) || 0;
      const difference = actualPhysicalStock - currentStock;

      transaction.update(prodRef, {
        stock: Math.max(0, actualPhysicalStock),
        updatedAt: new Date().toISOString(),
      });

      // Create opname log
      const logRef = doc(collection(db, INVENTORY_LOGS_COLLECTION));
      transaction.set(logRef, {
        productId: productId,
        productSku: prodData.sku || '',
        productName: prodData.name || 'Produk',
        type: 'opname',
        quantityChange: difference,
        previousStock: currentStock,
        newStock: Math.max(0, actualPhysicalStock),
        notes: `Stock Opname: ${reason || 'Penyesuaian hasil cek fisik'} (Selisih: ${difference > 0 ? '+' : ''}${difference})`,
        staffName: staffName || 'Petugas Opname',
        costPriceAtTime: prodData.costPrice || 0,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, INVENTORY_LOGS_COLLECTION);
    throw error;
  }
}
