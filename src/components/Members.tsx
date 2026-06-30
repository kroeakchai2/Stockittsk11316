import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

interface MembersProps {
  members: Member[];
  searchQuery: string;
}

export default function Members({ members, searchQuery }: MembersProps) {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Member states
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberDept, setNewMemberDept] = useState<string>('แผนกอายุรกรรม (Medicine)');
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberPhone, setNewMemberPhone] = useState<string>('');
  const [newMemberStatus, setNewMemberStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [addError, setAddError] = useState<string>('');

  // 1. Departments list
  const departments = [
    'All',
    'แผนกอายุรกรรม (Medicine)',
    'แผนกผู้ป่วยนอก (OPD)',
    'ฝ่ายสารสนเทศ (IT Department)',
    'แผนกศัลยกรรม (Surgery)',
    'ฝ่ายบริหาร (Administration)'
  ];

  // 2. Filter Members based on search query and department
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'All' || member.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [members, searchQuery, selectedDept]);

  // 3. Toggle Status of Member in real-time
  const handleToggleStatus = async (member: Member) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const memberRef = doc(db, 'members', member.id);
      await updateDoc(memberRef, {
        status: newStatus
      });
    } catch (err) {
      console.error('Error toggling member status:', err);
    }
  };

  // 4. Save New Member to Firestore (REAL-TIME)
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) {
      setAddError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setAddError('');

    try {
      const newId = `MEM-${Date.now().toString().slice(-4)}`;
      const memberRef = doc(db, 'members', newId);

      const newMember: Member = {
        id: newId,
        name: newMemberName,
        department: newMemberDept,
        email: newMemberEmail,
        phone: newMemberPhone || '-',
        withdrawCount: 0,
        status: newMemberStatus
      };

      await setDoc(memberRef, newMember);

      // Reset Form State
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberStatus('ACTIVE');
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error adding new member:', err);
      setAddError('ไม่สามารถเพิ่มรายชื่อสมาชิกได้: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                selectedDept === dept
                  ? 'bg-primary text-white'
                  : 'bg-surface-container hover:bg-surface-container-highest text-secondary'
              }`}
            >
              {dept === 'All' ? 'แผนกทั้งหมด' : dept.split(' (')[0]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          อนุญาตสมาชิกใหม่
        </button>
      </div>

      {/* Members Directory Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table border-collapse">
            <thead className="bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4">รหัสบุคลากร</th>
                <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                <th className="px-6 py-4">แผนก / สังกัด</th>
                <th className="px-6 py-4">อีเมล / เบอร์โทรศัพท์</th>
                <th className="px-6 py-4 text-center">จำนวนครั้งที่เบิก</th>
                <th className="px-6 py-4 text-center">สถานะสิทธิ์</th>
                <th className="px-6 py-4 text-center">สลับสิทธิ์การเบิก</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredMembers.map((member) => {
                const isActive = member.status === 'ACTIVE';

                return (
                  <tr key={member.id} className="border-b border-outline-variant hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-outline">{member.id}</td>
                    <td className="px-6 py-4 font-bold text-on-background">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary">{member.department}</td>
                    <td className="px-6 py-4 text-on-surface-variant space-y-0.5">
                      <p className="font-mono font-medium">{member.email}</p>
                      <p className="text-[10px] font-semibold text-outline">โทร: {member.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold font-mono text-primary text-sm">{member.withdrawCount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isActive ? 'อนุมัติ (ACTIVE)' : 'ระงับสิทธิ์'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`px-3 py-1.5 rounded text-[10px] font-black cursor-pointer border transition-colors ${
                          isActive 
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? 'บล็อกสิทธิ์' : 'ปลดบล็อก'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary font-medium">
                    ไม่พบรายชื่อบุคลากรทางการแพทย์ที่ตรงตามการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Member Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in duration-150 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-outline-variant pb-2">
              <div>
                <h3 className="text-base font-black text-primary font-display">อนุญาตสิทธิ์และขึ้นทะเบียนบุคลากร</h3>
                <p className="text-[10px] text-outline mt-0.5">ระบุชื่อเจ้าหน้าที่เพื่อเข้าสู่รายชื่อผู้มีสิทธิ์เบิกจ่ายอุปกรณ์สารสนเทศ</p>
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

            {/* Form */}
            <form onSubmit={handleAddMember} className="space-y-4">
              
              {addError && (
                <div className="bg-error-container text-on-error-container p-2.5 rounded font-bold border border-error/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-secondary font-bold mb-1">ชื่อ-นามสกุล และยศแพทย์/พยาบาล/เจ้าหน้าที่:</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="ตัวอย่าง: นพ. สุรชัย ใจดี"
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">แผนกที่สังกัดภายในโรงพยาบาล:</label>
                <select
                  value={newMemberDept}
                  onChange={(e) => setNewMemberDept(e.target.value)}
                  className="border border-outline-variant rounded-lg p-2.5 bg-surface w-full font-semibold"
                >
                  {departments.slice(1).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-secondary font-bold mb-1">อีเมลโรงพยาบาล:</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="example@hospital.go.th"
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-secondary font-bold mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
                  <input
                    type="text"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="border border-outline-variant rounded-lg p-2 bg-surface w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-secondary font-bold mb-1">สถานะสิทธิ์เบิกเริ่มต้น:</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newMemberStatus === 'ACTIVE'}
                      onChange={() => setNewMemberStatus('ACTIVE')}
                    />
                    <span>อนุญาตทันที (ACTIVE)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newMemberStatus === 'INACTIVE'}
                      onChange={() => setNewMemberStatus('INACTIVE')}
                    />
                    <span>รอตรวจสอบสิทธิ์ (INACTIVE)</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
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
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  {submitting ? 'กำลังขึ้นทะเบียน...' : 'บันทึกขึ้นทะเบียน'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
