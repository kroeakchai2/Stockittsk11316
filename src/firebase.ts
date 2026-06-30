import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, limit, query } from 'firebase/firestore';
import { Item, Member, Transaction } from './types';

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDEqoHbyxSojYSRrc1iaMBHLy0DEngUemY",
  authDomain: "fluent-tea-ksx65.firebaseapp.com",
  projectId: "fluent-tea-ksx65",
  storageBucket: "fluent-tea-ksx65.firebasestorage.app",
  messagingSenderId: "802383892014",
  appId: "1:802383892014:web:a78b0ae898ee67b43459bf"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific database ID
export const db = getFirestore(app, "ai-studio-01eecc1f-3711-4e57-8217-40a26b35920e");

// Seed data function to populate initial values if the DB is empty
export async function seedDatabaseIfEmpty() {
  try {
    const itemsSnapshot = await getDocs(query(collection(db, 'items'), limit(1)));
    if (!itemsSnapshot.empty) {
      console.log('Database already has items. Skipping seed.');
      return;
    }

    console.log('Seeding database with clinical IT inventory data...');
    const batch = writeBatch(db);

    // 1. Seed Items (Total withdrawCount * price = 1,450,200 THB exactly for spent budget)
    // Plus high-value server & firewall to get close to the 4,288,500 THB net inventory value
    const initialItems: Item[] = [
      {
        id: 'IT-NET-001',
        name: 'Cat6 Ethernet Cable (1000ft)',
        category: 'Networking',
        quantity: 8,
        withdrawCount: 45,
        unit: 'ม้วน',
        price: 3500,
        minThreshold: 10,
        status: 'LOW STOCK',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-PC-042',
        name: 'Monitor Dell 24" P2422H',
        category: 'End-user Devices',
        quantity: 24,
        withdrawCount: 32,
        unit: 'จอ',
        price: 6000,
        minThreshold: 5,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-ACC-105',
        name: 'Logitech Wireless Mouse M185',
        category: 'Peripherals',
        quantity: 50,
        withdrawCount: 120,
        unit: 'ชิ้น',
        price: 390,
        minThreshold: 15,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-SRV-009',
        name: 'SSD Samsung 970 EVO 1TB',
        category: 'Others',
        quantity: 0,
        withdrawCount: 15,
        unit: 'ชิ้น',
        price: 3950,
        minThreshold: 5,
        status: 'OUT OF STOCK',
        image: 'https://images.unsplash.com/photo-1597872200919-0127a44605ea?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-PC-101',
        name: 'Laptop HP ProBook 445 G9',
        category: 'End-user Devices',
        quantity: 5,
        withdrawCount: 15,
        unit: 'เครื่อง',
        price: 28000,
        minThreshold: 3,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-NET-002',
        name: 'Cisco Catalyst 24-Port Switch',
        category: 'Networking',
        quantity: 2,
        withdrawCount: 8,
        unit: 'ตัว',
        price: 45000,
        minThreshold: 2,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-PC-088',
        name: 'iPad Air (64GB, Wi-Fi)',
        category: 'End-user Devices',
        quantity: 6,
        withdrawCount: 15,
        unit: 'เครื่อง',
        price: 14310,
        minThreshold: 3,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      // High-Value assets to match target net inventory of ~4,288,500
      {
        id: 'IT-SRV-001',
        name: 'Server Dell PowerEdge R760',
        category: 'Others',
        quantity: 4,
        withdrawCount: 1,
        unit: 'เครื่อง',
        price: 940000,
        minThreshold: 1,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'IT-NET-003',
        name: 'Firewall Fortinet FortiGate 100F',
        category: 'Networking',
        quantity: 5,
        withdrawCount: 0,
        unit: 'ตัว',
        price: 104228,
        minThreshold: 1,
        status: 'IN STOCK',
        image: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?w=500&auto=format&fit=crop&q=60',
        updatedAt: new Date().toISOString()
      }
    ];

    initialItems.forEach(item => {
      const itemRef = doc(db, 'items', item.id);
      batch.set(itemRef, item);
    });

    // 2. Seed Authorized Members
    const initialMembers: Member[] = [
      {
        id: 'MEM-001',
        name: 'ดร. นายแพทย์เกริกชัย แสงรัตน์',
        department: 'แผนกอายุรกรรม (Medicine)',
        email: 'kroeakchai@gmail.com',
        phone: '081-234-5678',
        withdrawCount: 8,
        status: 'ACTIVE'
      },
      {
        id: 'MEM-002',
        name: 'พยาบาลสมศรี รักดี',
        department: 'แผนกผู้ป่วยนอก (OPD)',
        email: 'somsri.r@hospital.go.th',
        phone: '089-876-5432',
        withdrawCount: 15,
        status: 'ACTIVE'
      },
      {
        id: 'MEM-003',
        name: 'ดนัย ชัยเจริญ (IT Support)',
        department: 'ฝ่ายสารสนเทศ (IT Department)',
        email: 'danai.c@hospital.go.th',
        phone: '086-111-2222',
        withdrawCount: 42,
        status: 'ACTIVE'
      },
      {
        id: 'MEM-004',
        name: 'พญ. นภสร อมรวิวัฒน์',
        department: 'แผนกศัลยกรรม (Surgery)',
        email: 'naphasorn.a@hospital.go.th',
        phone: '084-555-6666',
        withdrawCount: 4,
        status: 'ACTIVE'
      },
      {
        id: 'MEM-005',
        name: 'วิชัย เกียรติเกรียงไกร',
        department: 'ฝ่ายบริหาร (Administration)',
        email: 'wichai.k@hospital.go.th',
        phone: '082-333-4444',
        withdrawCount: 0,
        status: 'INACTIVE'
      }
    ];

    initialMembers.forEach(member => {
      const memberRef = doc(db, 'members', member.id);
      batch.set(memberRef, member);
    });

    // 3. Seed Transactions for the 30-day Trends chart
    const initialTransactions: Transaction[] = [
      {
        id: 'TX-001',
        itemId: 'IT-NET-001',
        itemName: 'Cat6 Ethernet Cable (1000ft)',
        type: 'WITHDRAW',
        quantity: 15,
        memberName: 'ดนัย ชัยเจริญ (IT Support)',
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'ติดตั้งโครงข่ายเพิ่มเติมตึกผู้ป่วยใหม่ ชั้น 3'
      },
      {
        id: 'TX-002',
        itemId: 'IT-PC-042',
        itemName: 'Monitor Dell 24" P2422H',
        type: 'WITHDRAW',
        quantity: 12,
        memberName: 'พยาบาลสมศรี รักดี',
        date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'เปลี่ยนหน้าจอเคาน์เตอร์พยาบาล OPD'
      },
      {
        id: 'TX-003',
        itemId: 'IT-ACC-105',
        itemName: 'Logitech Wireless Mouse M185',
        type: 'WITHDRAW',
        quantity: 40,
        memberName: 'ดนัย ชัยเจริญ (IT Support)',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'แจกจ่ายรอบปีสำหรับเจ้าหน้าที่ธุรการตึกอำนวยการ'
      },
      {
        id: 'TX-004',
        itemId: 'IT-SRV-009',
        itemName: 'SSD Samsung 970 EVO 1TB',
        type: 'WITHDRAW',
        quantity: 15,
        memberName: 'ดนัย ชัยเจริญ (IT Support)',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'อัปเกรดเครื่องศูนย์รังสีวิทยาและเวชศาสตร์นิวเคลียร์'
      },
      {
        id: 'TX-005',
        itemId: 'IT-PC-101',
        itemName: 'Laptop HP ProBook 445 G9',
        type: 'WITHDRAW',
        quantity: 5,
        memberName: 'ดร. นายแพทย์เกริกชัย แสงรัตน์',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'สำหรับแพทย์ประจำบ้านศึกษาผลการตรวจแล็บตึก IPD'
      },
      {
        id: 'TX-006',
        itemId: 'IT-NET-001',
        itemName: 'Cat6 Ethernet Cable (1000ft)',
        type: 'RESTOCK',
        quantity: 20,
        memberName: 'ดนัย ชัยเจริญ (IT Support)',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'สั่งซื้อนำเข้าคลังทดแทนส่วนที่ใช้งาน'
      },
      {
        id: 'TX-007',
        itemId: 'IT-PC-088',
        itemName: 'iPad Air (64GB, Wi-Fi)',
        type: 'WITHDRAW',
        quantity: 6,
        memberName: 'พญ. นภสร อมรวิวัฒน์',
        date: new Date().toISOString(),
        notes: 'เบิกไปใช้งานตรวจคนไข้บนรถเข็น (Ward Round)'
      }
    ];

    initialTransactions.forEach(tx => {
      const txRef = doc(db, 'transactions', tx.id);
      batch.set(txRef, tx);
    });

    await batch.commit();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
