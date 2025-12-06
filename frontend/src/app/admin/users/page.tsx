"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Shield, Edit2, Check, Coins } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  patinhasBalance: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado temporário para edição
  const [editRole, setEditRole] = useState("");
  const [editBalance, setEditBalance] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data);
    setLoading(false);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditBalance(user.patinhasBalance);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/admin/users/${editingId}`, {
        role: editRole,
        patinhasBalance: Number(editBalance)
      });
      setEditingId(null);
      fetchUsers(); // Recarrega lista
      alert("Usuário atualizado!");
    } catch (error) {
      alert("Erro ao atualizar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-gato-purple" /> Gestão de Usuários
        </h1>
        <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
          <Search className="w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Buscar email..." className="bg-transparent border-none focus:ring-0 text-sm text-white outline-none" />
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Saldo (Patinhas)</th>
              <th className="px-6 py-4">Data Registro</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{user.fullName}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                
                {/* EDIÇÃO DE CARGO */}
                <td className="px-6 py-4">
                  {editingId === user.id ? (
                    <select 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value)}
                      className="bg-black border border-gato-purple rounded px-2 py-1 text-white"
                    >
                      <option value="USER">USER</option>
                      <option value="UPLOADER">UPLOADER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.role === 'OWNER' ? 'bg-amber-500/20 text-amber-500' :
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500' :
                      'bg-zinc-700/50 text-zinc-400'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>

                {/* EDIÇÃO DE SALDO */}
                <td className="px-6 py-4">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={editBalance} 
                          onChange={e => setEditBalance(Number(e.target.value))}
                          className="w-20 bg-black border border-gato-purple rounded px-2 py-1 text-white"
                        />
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-gato-amber font-mono">
                      <Coins className="w-3 h-3" /> {user.patinhasBalance}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right">
                  {editingId === user.id ? (
                    <button onClick={saveEdit} className="bg-gato-green text-black p-1.5 rounded hover:brightness-110">
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => startEdit(user)} className="text-zinc-400 hover:text-white p-1.5 hover:bg-white/10 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}