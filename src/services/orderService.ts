import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  onSnapshot, 
  addDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, Customer, OrderStatus, PaymentStatus } from '../types';

const ORDERS_COLLECTION = 'orders';
const CUSTOMERS_COLLECTION = 'customers';
const PRODUCTS_COLLECTION = 'products';

// Generate human-friendly invoice number
export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `INV-RF-${dateStr}-${randomStr}`;
}

// Create new order
export async function createOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also register or update customer record
    await syncCustomerFromOrder(orderData);

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
  }
}

// Upload/submit payment proof
export async function submitPaymentProof(
  orderId: string, 
  proofUrl: string, 
  proofName?: string
): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      paymentProofUrl: proofUrl,
      paymentProofName: proofName || 'Bukti Transfer',
      paymentStatus: 'paid_waiting_approval' as PaymentStatus,
      rejectionReason: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// Approve payment proof & deduct product stock
export async function approvePaymentProof(orderId: string, adminNotes?: string): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Pesanan tidak ditemukan');
    }

    const orderData = orderSnap.data() as Order;

    // Run transaction to safely deduct stock and approve order
    await runTransaction(db, async (transaction) => {
      // 1. Read all product docs to ensure stock is valid
      const productSnaps = [];
      for (const item of orderData.items) {
        const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodDoc = await transaction.get(prodRef);
        productSnaps.push({ ref: prodRef, doc: prodDoc, item });
      }

      // 2. Perform updates & inventory logging
      for (const { ref, doc: pDoc, item } of productSnaps) {
        if (pDoc.exists()) {
          const currentStock = Number(pDoc.data().stock) || 0;
          const currentSold = Number(pDoc.data().soldCount) || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          const newSold = currentSold + item.quantity;
          transaction.update(ref, {
            stock: newStock,
            soldCount: newSold,
            updatedAt: new Date().toISOString()
          });

          // Log stock deduction in inventory_logs
          const logRef = doc(collection(db, 'inventory_logs'));
          transaction.set(logRef, {
            productId: item.productId,
            productSku: pDoc.data().sku || '',
            productName: item.productName,
            type: 'out',
            quantityChange: -item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            notes: `Pesanan Webstore #${orderData.orderNumber} Disetujui`,
            staffName: 'Admin Webstore',
            costPriceAtTime: pDoc.data().costPrice || 0,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 3. Update order status
      transaction.update(orderRef, {
        paymentStatus: 'approved',
        orderStatus: 'processing',
        approvedAt: new Date().toISOString(),
        adminNotes: adminNotes || 'Pembayaran telah diverifikasi oleh admin',
        updatedAt: new Date().toISOString()
      });
    });

    // Update customer stats
    await updateCustomerSpend(orderData.customerEmail, orderData.totalAmount);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// Reject payment proof
export async function rejectPaymentProof(orderId: string, reason: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      paymentStatus: 'rejected' as PaymentStatus,
      rejectionReason: reason || 'Bukti transfer tidak valid atau belum masuk ke rekening',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// Update order status (processing -> shipped -> completed -> cancelled)
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// Subscribe to all orders
export function subscribeToOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, ORDERS_COLLECTION),
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        orders.push({
          id: docSnapshot.id,
          orderNumber: data.orderNumber || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          recipientName: data.recipientName || '',
          recipientPhone: data.recipientPhone || '',
          shippingAddress: data.shippingAddress || '',
          deliveryDate: data.deliveryDate || '',
          cardMessage: data.cardMessage || '',
          items: data.items || [],
          subtotal: Number(data.subtotal) || 0,
          shippingCost: Number(data.shippingCost) || 0,
          totalAmount: Number(data.totalAmount) || 0,
          paymentMethod: data.paymentMethod || 'BCA',
          paymentStatus: data.paymentStatus || 'pending',
          orderStatus: data.orderStatus || 'pending',
          paymentProofUrl: data.paymentProofUrl,
          paymentProofName: data.paymentProofName,
          rejectionReason: data.rejectionReason,
          adminNotes: data.adminNotes,
          approvedAt: data.approvedAt,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort newest first
      orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      onSuccess(orders);
    },
    (error) => {
      console.error('Error subscribing to orders:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
    }
  );

  return unsubscribe;
}

// Subscribe to customers collection
export function subscribeToCustomers(
  onSuccess: (customers: Customer[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onSnapshot(
    collection(db, CUSTOMERS_COLLECTION),
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        customers.push({
          id: docSnapshot.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          totalOrders: Number(data.totalOrders) || 0,
          totalSpent: Number(data.totalSpent) || 0,
          lastOrderDate: data.lastOrderDate || '',
          createdAt: data.createdAt || '',
        });
      });

      customers.sort((a, b) => b.totalSpent - a.totalSpent);
      onSuccess(customers);
    },
    (error) => {
      console.error('Error subscribing to customers:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, CUSTOMERS_COLLECTION);
    }
  );

  return unsubscribe;
}

// Helper: sync customer profile when an order is created
async function syncCustomerFromOrder(order: Omit<Order, 'id'>): Promise<void> {
  try {
    const customerId = order.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const existing = await getDoc(customerRef);

    if (existing.exists()) {
      await updateDoc(customerRef, {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.shippingAddress,
        totalOrders: increment(1),
        lastOrderDate: order.createdAt,
      });
    } else {
      await setDoc(customerRef, {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.shippingAddress,
        totalOrders: 1,
        totalSpent: 0, // Spent increments on approval
        lastOrderDate: order.createdAt,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Customer sync warning:', error);
  }
}

// Helper: increment customer spend on order approval
async function updateCustomerSpend(email: string, amount: number): Promise<void> {
  try {
    const customerId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const existing = await getDoc(customerRef);
    if (existing.exists()) {
      await updateDoc(customerRef, {
        totalSpent: increment(amount),
      });
    }
  } catch (error) {
    console.warn('Update customer spend warning:', error);
  }
}
