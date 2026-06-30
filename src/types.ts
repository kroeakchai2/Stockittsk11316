export interface Item {
  id: string; // SKU code, e.g., IT-NET-001
  name: string;
  category: 'Networking' | 'End-user Devices' | 'Peripherals' | 'Others';
  quantity: number;
  withdrawCount: number;
  unit: string;
  price: number;
  minThreshold: number;
  status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';
  image: string;
  updatedAt: string; // ISO string
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'WITHDRAW' | 'RESTOCK';
  quantity: number;
  memberName: string;
  date: string; // ISO string
  notes?: string;
}

export interface Member {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  withdrawCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}
