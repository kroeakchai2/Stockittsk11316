import React, { useState, useEffect } from 'react';
import { db, seedDatabaseIfEmpty } from './firebase';
import { collection, onSnapshot, query, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Item, Member, Transaction } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Members from './components/Members';
import Reports from './components/Reports';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'members' | 'reports'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firestore real-time collections
  const [items, setItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Dialog modals states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Add Item form states
  const [newSku, setNewSku] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'Networking' | 'End-user Devices' | 'Peripherals' | 'Others'>('Networking');
  const [newQty, setNewQty] = useState<number>(1);
  const [newUnit, setNewUnit] = useState<string>('ชิ้น');
  const [newPrice, setNewPrice] = useState<number>(100);
  const [newMinThreshold, setNewMinThreshold] = useState<number>(5);
  const [newImage, setNewImage] = useState<string>('');
  const [addError, setAddError] = useState<string>('');
  const [savingAdd, setSavingAdd] = useState<boolean>(false);

  // Edit Item form states
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<'Networking' | 'End-user Devices' | 'Peripherals' | 'Others'>('Networking');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMinThreshold, setEditMinThreshold] = useState<number>(0);
  const [editImage, setEditImage] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // 1. Initial Seeding and setup of real-time firestore listeners
  useEffect(() => {
    // Seed database if empty
    seedDatabaseIfEmpty();

    // Listen to Items
    const unsubscribeItems = onSnapshot(query(collection(db, 'items')), (snapshot) => {
      const fetchedItems: Item[] = [];
      snapshot.forEach((doc) => {
        fetchedItems.push(doc.data() as Item);
      });
      setItems(fetchedItems);
    }, (err) => console.error('Error listening to items:', err));

    // Listen to Members
    const unsubscribeMembers = onSnapshot(query(collection(db, 'members')), (snapshot) => {
      const fetchedMembers: Member[] = [];
      snapshot.forEach((doc) => {
        fetchedMembers.push(doc.data() as Member);
      });
      setMembers(fetchedMembers);
    }, (err) => console.error('Error listening to members:', err));

    // Listen to Transactions
    const unsubscribeTx = onSnapshot(query(collection(db, 'transactions')), (snapshot) => {
      const fetchedTx: Transaction[] = [];
      snapshot.forEach((doc) => {
        fetchedTx.push(doc.data() as Transaction);
      });
      // Sort transactions descending by date
      fetchedTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(fetchedTx);
    }, (err) => console.error('Error listening to transactions:', err));

    return () => {
      unsubscribeItems();
      unsubscribeMembers();
      unsubscribeTx();
    };
  }, []);

  // 2. Add New Product in Firestore (REAL-TIME)
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName || !newUnit || newPrice <= 0) {
      setAddError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // Check duplicate SKU
    const skuExists = items.some(item => item.id.toLowerCase() === newSku.toLowerCase().trim());
    if (skuExists) {
      setAddError(`รหัส SKU '${newSku}' ถูกใช้งานไปแล้วในระบบ`);
      return;
    }

    setSavingAdd(true);
    setAddError('');

    try {
      const cleanSku = newSku.toUpperCase().trim();
      const itemRef = doc(db, 'items', cleanSku);

      // Status calculation
      let status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' = 'IN STOCK';
      if (newQty === 0) {
        status = 'OUT OF STOCK';
      } else if (newQty <= newMinThreshold) {
        status = 'LOW STOCK';
      }

      // Default visual theme Unsplash image if blank
      const finalImage = newImage.trim() || {
        'Networking': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
        'End-user Devices': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
        'Peripherals': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
        'Others': 'https://images.unsplash.com/photo-1597872200919-0127a44605ea?w=500'
      }[newCategory];

      const newItem: Item = {
        id: cleanSku,
        name: newName,
        category: newCategory,
        quantity: newQty,
        withdrawCount: 0,
        unit: newUnit,
        price: newPrice,
        minThreshold: newMinThreshold,
        status,
        image: finalImage,
        updatedAt: new Date().toISOString()
      };

      await setDoc(itemRef, newItem);

      // Create log entry for new addition
      const txId = `TX-${Date.now()}`;
      const txRef = doc(db, 'transactions', txId);
      const newTransaction: Transaction = {
        id: txId,
        itemId: cleanSku,
        itemName: newName,
        type: 'RESTOCK',
        quantity: newQty,
        memberName: 'ฝ่ายพัสดุส่วนกลาง (Central Stock)',
        date: new Date().toISOString(),
        notes: 'ขึ้นทะเบียนเวชภัณฑ์นำเข้าคลังใหม่'
      };
      await setDoc(txRef, newTransaction);

      // Reset add form states
      setNewSku('');
      setNewName('');
      setNewCategory('Networking');
      setNewQty(1);
      setNewUnit('ชิ้น');
      setNewPrice(100);
      setNewMinThreshold(5);
      setNewImage('');
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error adding new item to firestore:', err);
      setAddError('ไม่สามารถสร้างข้อมูลพัสดุได้: ' + err.message);
    } finally {
      setSavingAdd(false);
    }
  };

  // 3. Edit Product in Firestore (REAL-TIME)
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditMinThreshold(item.minThreshold);
    setEditImage(item.image);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editName || editPrice <= 0) {
      setEditError('ข้อมูลจำเป็นต้องครบถ้วน');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      const itemRef = doc(db, 'items', editingItem.id);
      
      // Recompute status based on existing quantity and new threshold
      let status = editingItem.status;
      if (editingItem.quantity === 0) {
        status = 'OUT OF STOCK';
      } else if (editingItem.quantity <= editMinThreshold) {
        status = 'LOW STOCK';
      } else {
        status = 'IN STOCK';
      }

      await updateDoc(itemRef, {
        name: editName,
        category: editCategory,
        price: editPrice,
        minThreshold: editMinThreshold,
        image: editImage,
        status,
        updatedAt: new Date().toISOString()
      });

      setEditingItem(null);
    } catch (err: any) {
      console.error('Error updating item:', err);
      setEditError('ไม่สามารถบันทึกการแก้ไขได้: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      
      {/* 1. Sidebar Navigation (Left - Desktop Only) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddNewItem={() => setShowAddModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* 2. Top Header Navigation (Search and Profile Actions) */}
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => alert('ตัวเลือกการตั้งค่าผู้ใช้ และการเชื่อมต่อ API ของโรงพยาบาล')}
          onOpenNotifications={() => alert('ไม่มีการแจ้งเตือนพัสดุวิกฤติตอนนี้')}
        />

        {/* 3. Screen Body with Route Transition */}
        <main className="flex-grow p-6 max-w-7xl mx-auto w-full pb-20 md:pb-6">
          
          {/* Active Screen Headers */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-primary">
                {{
                  dashboard: 'รายงานสรุปผลโรงพยาบาล',
                  inventory: 'คลังสินค้าและพัสดุเวชภัณฑ์',
                  members: 'ระบบจัดการรายชื่อสิทธิ์ผู้เบิก',
                  reports: 'รายงานประวัติการเบิกจ่าย'
                }[activeTab]}
              </h2>
              <p className="text-sm text-on-surface-variant font-medium">
                {{
                  dashboard: 'วิเคราะห์ข้อมูลสรุปและการเคลื่อนไหวคลังสินค้าส่วนสารสนเทศ',
                  inventory: 'ตรวจสอบสต็อก ระบุเกณฑ์เตือนภัย และอัปเดตนำเข้า-เบิกพัสดุสะดวกรวดเร็ว',
                  members: 'รายชื่อบุคลากรและแพทย์ที่ได้รับการรับรองสิทธิ์ความปลอดภัย',
                  reports: 'ประวัติบันทึกการเคลื่อนย้าย ยอดคงเหลือ และส่งออกใบรายการนำเสนอ'
                }[activeTab]}
              </p>
            </div>
            {activeTab === 'dashboard' && (
              <div className="flex gap-2 text-xs">
                <button className="flex items-center gap-2 border border-outline-variant rounded-lg px-3 py-2 hover:bg-surface-container font-semibold transition-colors">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>01 ม.ค. 2024 - 31 ม.ค. 2024</span>
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-container text-white rounded-lg px-3 py-2 font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">file_download</span>
                  <span>ตรวจสอบรายงาน</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Renderers wrapper */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  items={items} 
                  transactions={transactions} 
                  onNavigateToTab={setActiveTab}
                />
              )}
              {activeTab === 'inventory' && (
                <Inventory 
                  items={items} 
                  members={members} 
                  searchQuery={searchQuery}
                  onOpenAddModal={() => setShowAddModal(true)}
                  onOpenEditModal={handleOpenEdit}
                />
              )}
              {activeTab === 'members' && (
                <Members 
                  members={members} 
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === 'reports' && (
                <Reports 
                  transactions={transactions} 
                  searchQuery={searchQuery}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <footer className="mt-12 border-t border-outline-variant pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-on-surface-variant gap-4">
            <p>© 2024 StockIT Hospital IT Management System. All rights reserved.</p>
            <div className="flex gap-4 font-semibold">
              <a href="#" className="hover:text-primary transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="hover:text-primary transition-colors">ช่วยเหลือ</a>
              <a href="#" className="hover:text-primary transition-colors">ติดต่อ IT Support</a>
            </div>
          </footer>

        </main>
      </div>

      {/* 4. Bottom Tab Navigation (Mobile/Tablet Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant flex justify-around items-center h-16 z-20">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'dashboard' ? 'text-primary' : 'text-secondary'}`}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span className="text-[10px] font-bold">แดชบอร์ด</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'inventory' ? 'text-primary' : 'text-secondary'}`}
        >
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          <span className="text-[10px] font-bold">คลัง</span>
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'members' ? 'text-primary' : 'text-secondary'}`}
        >
          <span className="material-symbols-outlined text-lg">group</span>
          <span className="text-[10px] font-bold">สมาชิก</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'reports' ? 'text-primary' : 'text-secondary'}`}
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          <span className="text-[10px] font-bold">รายงาน</span>
        </button>
      </nav>

      {/* --- ADD NEW PRODUCT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in duration-150 text-xs text-left">
            <div className="flex justify-between items-start mb-4 border-b border-outline-variant pb-2">
              <div>
                <h3 className="text-base font-black text-primary font-display">ลงทะเบียนนำพัสดุขึ้นระบบ</h3>
                <p className="text-[10px] text-outline font-semibold mt-0.5">ระบุรายละเอียดเวชภัณฑ์ไอทีเพื่อนำเข้าคลังสินค้า</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                }}
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5">
              
              {addError && (
                <div className="bg-error-container text-on-error-container p-2.5 rounded font-bold border border-error/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{addError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold mb-1">รหัสสินค้า (SKU):</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="ตัวอย่าง: IT-NET-100"
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold mb-1">หมวดหมู่เวชภัณฑ์:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-bold"
                  >
                    <option value="Networking">Networking</option>
                    <option value="End-user Devices">End-user Devices</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">ชื่อเวชภัณฑ์ (และรายละเอียดสินค้า):</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ตัวอย่าง: สายสัญญาณ LAN CAT6 ทนไฟความยาว 30 เมตร"
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-bold text-on-background"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-secondary font-bold mb-1">จำนวนเริ่มต้น:</label>
                  <input
                    type="number"
                    min="0"
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold mb-1">หน่วยนับ:</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="ชิ้น / จอ / ม้วน"
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold mb-1">เกณฑ์แจ้งสต็อกต่ำ:</label>
                  <input
                    type="number"
                    min="1"
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(parseInt(e.target.value) || 1)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">ราคาต้นทุนต่อหน่วย (บาท):</label>
                <input
                  type="number"
                  min="1"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">ลิงก์ภาพพัสดุ (Hotlink URL - เว้นว่างได้เพื่อใช้ภาพเริ่มต้น):</label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono text-outline"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError('');
                  }}
                  className="px-4 py-2.5 border border-outline-variant rounded-lg text-secondary font-bold hover:bg-surface-container cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  {savingAdd ? 'กำลังบันทึก...' : 'บันทึกเข้าสู่คลัง'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in duration-150 text-xs text-left">
            <div className="flex justify-between items-start mb-4 border-b border-outline-variant pb-2">
              <div>
                <h3 className="text-base font-black text-primary font-display">แก้ไขรายละเอียดเวชภัณฑ์</h3>
                <p className="text-[10px] text-outline font-semibold mt-0.5 font-mono">แก้ไขพัสดุรหัส: {editingItem.id}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingItem(null);
                  setEditError('');
                }}
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {editError && (
                <div className="bg-error-container text-on-error-container p-2.5 rounded font-bold border border-error/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-secondary font-bold mb-1">หมวดหมู่เวชภัณฑ์:</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-bold"
                >
                  <option value="Networking">Networking</option>
                  <option value="End-user Devices">End-user Devices</option>
                  <option value="Peripherals">Peripherals</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">ชื่อเวชภัณฑ์:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-bold text-on-background"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold mb-1">ราคาต่อหน่วย (บาท):</label>
                  <input
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold mb-1">เกณฑ์แจ้งสต็อกต่ำ:</label>
                  <input
                    type="number"
                    min="1"
                    value={editMinThreshold}
                    onChange={(e) => setEditMinThreshold(parseInt(e.target.value) || 1)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">ลิงก์ภาพพัสดุ (Hotlink URL):</label>
                <input
                  type="url"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono text-outline"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setEditError('');
                  }}
                  className="px-4 py-2.5 border border-outline-variant rounded-lg text-secondary font-bold hover:bg-surface-container cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
