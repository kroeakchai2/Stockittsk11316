import React, { useState, useMemo } from 'react';
import { Item, Member, Transaction } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, increment } from 'firebase/firestore';

interface InventoryProps {
  items: Item[];
  members: Member[];
  searchQuery: string;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: Item) => void;
}

export default function Inventory({ items, members, searchQuery, onOpenAddModal, onOpenEditModal }: InventoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Interactive operation states
  const [activeActionItem, setActiveActionItem] = useState<Item | null>(null);
  const [actionType, setActionType] = useState<'WITHDRAW' | 'RESTOCK' | null>(null);
  const [actionQty, setActionQty] = useState<number>(1);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // 1. Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const categories = ['All', 'Networking', 'End-user Devices', 'Peripherals', 'Others'];

  // 2. Perform Withdraw or Restock action in Firestore (REAL-TIME WRITES)
  const handlePerformAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionItem || !actionType) return;
    
    if (actionQty <= 0) {
      setActionError('จำนวนต้องมากกว่า 0');
      return;
    }

    if (actionType === 'WITHDRAW') {
      if (actionQty > activeActionItem.quantity) {
        setActionError(`มีสินค้าไม่เพียงพอในคลัง (คงเหลือ ${activeActionItem.quantity} ${activeActionItem.unit})`);
        return;
      }
      if (!selectedMemberId) {
        setActionError('กรุณาเลือกสมาชิกผู้เบิกเวชภัณฑ์');
        return;
      }
    }

    setSubmitting(true);
    setActionError('');

    try {
      const itemRef = doc(db, 'items', activeActionItem.id);
      
      const newQty = actionType === 'WITHDRAW' 
        ? activeActionItem.quantity - actionQty 
        : activeActionItem.quantity + actionQty;
      
      const newWithdrawCount = actionType === 'WITHDRAW'
        ? activeActionItem.withdrawCount + actionQty
        : activeActionItem.withdrawCount;

      // Determine new status
      let newStatus: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' = 'IN STOCK';
      if (newQty === 0) {
        newStatus = 'OUT OF STOCK';
      } else if (newQty <= activeActionItem.minThreshold) {
        newStatus = 'LOW STOCK';
      }

      // Update Item in Firestore
      await updateDoc(itemRef, {
        quantity: newQty,
        withdrawCount: newWithdrawCount,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Find the member name
      const member = members.find(m => m.id === selectedMemberId);
      const memberName = actionType === 'WITHDRAW' && member ? `${member.name} (${member.department})` : 'ฝ่ายพัสดุส่วนกลาง (Central Stock)';

      // Generate a clean transaction document
      const txId = `TX-${Date.now()}`;
      const txRef = doc(db, 'transactions', txId);
      const newTransaction: Transaction = {
        id: txId,
        itemId: activeActionItem.id,
        itemName: activeActionItem.name,
        type: actionType,
        quantity: actionQty,
        memberName,
        date: new Date().toISOString(),
        notes: actionNotes || (actionType === 'WITHDRAW' ? 'เบิกใช้งานทั่วไป' : 'จัดส่งเข้าคลังตามรอบปี')
      };

      await setDoc(txRef, newTransaction);

      // Increment Member withdraw count if withdrawal
      if (actionType === 'WITHDRAW' && selectedMemberId) {
        const memberRef = doc(db, 'members', selectedMemberId);
        await updateDoc(memberRef, {
          withdrawCount: increment(1)
        });
      }

      // Reset state on success
      setActiveActionItem(null);
      setActionType(null);
      setActionQty(1);
      setSelectedMemberId('');
      setActionNotes('');
    } catch (err: any) {
      console.error('Error during inventory write action:', err);
      setActionError('ไม่สามารถบันทึกข้อมูลไปยังระบบคลังได้: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Chips Filter and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface-container hover:bg-surface-container-highest text-secondary'
              }`}
            >
              {cat === 'All' ? 'ทั้งหมด' : cat}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          เพิ่มเวชภัณฑ์ใหม่
        </button>
      </div>

      {/* Grid of Inventory Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          // Status styles
          const statusStyles = {
            'IN STOCK': 'bg-primary-container/20 text-primary border-primary-container/30',
            'LOW STOCK': 'bg-amber-100 text-amber-800 border-amber-300',
            'OUT OF STOCK': 'bg-error-container text-on-error-container border-error/30'
          }[item.status];

          return (
            <div 
              key={item.id} 
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Image and Header */}
              <div className="relative h-40 bg-surface flex items-center justify-center overflow-hidden border-b border-outline-variant">
                <img 
                  src={item.image || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'} 
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${statusStyles}`}>
                  {item.status}
                </span>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 text-[9px] font-bold bg-black/60 text-white rounded font-mono">
                  {item.id}
                </span>
              </div>

              {/* Content body */}
              <div className="p-4 space-y-3 flex-grow">
                <div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{item.category}</span>
                  <h4 className="text-sm font-bold text-on-background line-clamp-1 mt-0.5" title={item.name}>
                    {item.name}
                  </h4>
                </div>

                {/* Stock Counts */}
                <div className="grid grid-cols-2 gap-2 bg-background p-2.5 rounded-lg border border-outline-variant/50">
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant">คงเหลือในคลัง</p>
                    <p className="text-sm font-black text-primary font-mono mt-0.5">
                      {item.quantity} <span className="text-xs font-sans font-medium text-secondary">{item.unit}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant">ยอดเบิกสะสม</p>
                    <p className="text-sm font-black text-secondary font-mono mt-0.5">
                      {item.withdrawCount} <span className="text-xs font-sans font-medium text-secondary">{item.unit}</span>
                    </p>
                  </div>
                </div>

                {/* Price Label */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary font-medium">ราคาต่อหน่วย:</span>
                  <span className="font-mono font-bold text-on-background">
                    {item.price.toLocaleString('th-TH')} บ.
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-4 pb-4 pt-1 grid grid-cols-3 gap-2">
                <button
                  disabled={item.quantity === 0}
                  onClick={() => {
                    setActiveActionItem(item);
                    setActionType('WITHDRAW');
                  }}
                  className={`py-2 text-[11px] font-bold rounded cursor-pointer text-center border transition-colors ${
                    item.quantity === 0
                      ? 'bg-secondary-container text-outline border-outline-variant cursor-not-allowed'
                      : 'bg-primary text-white border-primary hover:bg-primary-container'
                  }`}
                >
                  เบิกพัสดุ
                </button>
                <button
                  onClick={() => {
                    setActiveActionItem(item);
                    setActionType('RESTOCK');
                  }}
                  className="bg-surface hover:bg-surface-container border border-outline-variant text-on-background py-2 text-[11px] font-bold rounded cursor-pointer text-center transition-colors"
                >
                  เติมสต็อก
                </button>
                <button
                  onClick={() => onOpenEditModal(item)}
                  className="bg-surface hover:bg-surface-container border border-outline-variant text-secondary py-2 text-[11px] font-semibold rounded cursor-pointer text-center transition-colors"
                >
                  แก้ไข
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Real-time Withdraw / Restock Dialog Overlay Modal */}
      {activeActionItem && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-outline-variant pb-2">
              <div>
                <h3 className="text-base font-black text-primary font-display">
                  {actionType === 'WITHDRAW' ? 'บันทึกใบเบิกพัสดุไอที' : 'เติมพัสดุและอัปเดตสต็อก'}
                </h3>
                <p className="text-[11px] text-outline font-semibold mt-0.5 font-mono">{activeActionItem.id} | {activeActionItem.name}</p>
              </div>
              <button 
                onClick={() => {
                  setActiveActionItem(null);
                  setActionType(null);
                  setActionError('');
                }}
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePerformAction} className="space-y-4 text-xs">
              
              {actionError && (
                <div className="bg-error-container text-on-error-container p-2.5 rounded text-[11px] font-bold flex items-center gap-2 border border-error/20">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{actionError}</span>
                </div>
              )}

              {/* Quantity Slider/Input */}
              <div>
                <label className="block text-secondary font-bold mb-1">จำนวนที่ต้องการ ({activeActionItem.unit}):</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number"
                    min="1"
                    max={actionType === 'WITHDRAW' ? activeActionItem.quantity : 1000}
                    value={actionQty}
                    onChange={(e) => setActionQty(parseInt(e.target.value) || 1)}
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-24 text-center font-bold"
                    required
                  />
                  <span className="text-outline">คงคลังในคลัง: {activeActionItem.quantity} {activeActionItem.unit}</span>
                </div>
              </div>

              {/* Authorized Member Select (Only for WITHDRAW) */}
              {actionType === 'WITHDRAW' && (
                <div>
                  <label className="block text-secondary font-bold mb-1">สมาชิกผู้ขอเบิกเวชภัณฑ์:</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-medium"
                    required
                  >
                    <option value="">-- เลือกแพทย์/พยาบาล/เจ้าหน้าที่ --</option>
                    {members
                      .filter(m => m.status === 'ACTIVE')
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.department})
                        </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-secondary font-bold mb-1">หมายเหตุการดำเนินการ:</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'WITHDRAW' ? 'ระบุตึก/ฝ่าย หรือวัตถุประสงค์การใช้งาน...' : 'ระบุหมายเหตุใบสั่งซื้อ หรือรอบเติมสินค้า...'}
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full h-20 outline-none focus:border-primary"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionItem(null);
                    setActionType(null);
                    setActionError('');
                  }}
                  className="px-4 py-2.5 border border-outline-variant rounded-lg text-secondary font-bold hover:bg-surface-container cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {submitting ? 'กำลังบันทึก...' : (actionType === 'WITHDRAW' ? 'ยืนยันการเบิก' : 'ยืนยันการเติม')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
