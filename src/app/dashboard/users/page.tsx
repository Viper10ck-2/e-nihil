'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react'
import { getAllUsers, createUser, updateUser, toggleUserActive, updateUserPassword } from '@/lib/actions'
import type { User, UserRole } from '@/types/database'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  kasubbag_anev: 'Kasubbag Anev',
  sekretaris: 'Sekretaris',
  inspektur: 'Inspektur',
}

const allRoles: UserRole[] = ['admin', 'kasubbag_anev', 'sekretaris', 'inspektur']

interface UserFormData {
  nip: string
  nama: string
  password: string
  pangkat: string
  jabatan: string
  instansi: string
  email: string
  roles: UserRole[]
}

const initialFormData: UserFormData = {
  nip: '',
  nama: '',
  password: '',
  pangkat: '',
  jabatan: '',
  instansi: 'Inspektorat Daerah Kabupaten Bintan',
  email: '',
  roles: [],
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch {
      toast.error('Gagal memuat data user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }))
  }

  const handleAddUser = async () => {
    if (!formData.nip || !formData.nama || !formData.password || formData.roles.length === 0) {
      toast.error('NIP, Nama, Password, dan minimal satu role wajib diisi')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsSubmitting(true)
    try {
      await createUser({
        nip: formData.nip,
        nama: formData.nama,
        password: formData.password,
        pangkat: formData.pangkat || undefined,
        jabatan: formData.jabatan || undefined,
        instansi: formData.instansi || undefined,
        email: formData.email || undefined,
        roles: formData.roles,
      })
      
      await loadUsers()
      setIsAddDialogOpen(false)
      setFormData(initialFormData)
      toast.success('User berhasil ditambahkan')
    } catch {
      toast.error('Gagal menambahkan user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await updateUser(selectedUser.id, {
        nama: formData.nama,
        pangkat: formData.pangkat || undefined,
        jabatan: formData.jabatan || undefined,
        instansi: formData.instansi || undefined,
        email: formData.email || undefined,
        roles: formData.roles,
      })

      // Update password if provided
      if (formData.password) {
        if (formData.password.length < 6) {
          toast.error('Password minimal 6 karakter')
          setIsSubmitting(false)
          return
        }
        await updateUserPassword(selectedUser.id, formData.password)
      }
      
      await loadUsers()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setFormData(initialFormData)
      toast.success('User berhasil diupdate')
    } catch {
      toast.error('Gagal mengupdate user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await toggleUserActive(user.id, !user.is_active)
      await loadUsers()
      toast.success(user.is_active ? 'User dinonaktifkan' : 'User diaktifkan')
    } catch {
      toast.error('Gagal mengubah status user')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      nip: user.nip,
      nama: user.nama,
      password: '', // Don't show existing password
      pangkat: user.pangkat || '',
      jabatan: user.jabatan || '',
      instansi: user.instansi || '',
      email: user.email || '',
      roles: user.roles,
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola akun staff dan assign role
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-700 text-sm" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tambah User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Tambahkan akun staff baru dan assign role yang sesuai
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nip">NIP *</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pangkat">Pangkat</Label>
                  <Input
                    id="pangkat"
                    value={formData.pangkat}
                    onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input
                    id="jabatan"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Role *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {allRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`role-${role}`} className="text-sm">
                        {roleLabels[role]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base text-slate-800">Daftar User</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Mobile card list */}
          <div className="block md:hidden divide-y">
            {users.map((user) => (
              <div key={user.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{user.nama}</p>
                  <Badge variant={user.is_active ? "default" : "secondary"} className="text-[10px]">
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-mono">{user.nip}</p>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                      {roleLabels[role]}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openEditDialog(user)}>
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleToggleActive(user)}>
                    {user.is_active ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                    {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-slate-600 font-semibold">NIP</TableHead>
                <TableHead className="text-slate-600 font-semibold">Nama</TableHead>
                <TableHead className="text-slate-600 font-semibold">Jabatan</TableHead>
                <TableHead className="text-slate-600 font-semibold">Role</TableHead>
                <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                <TableHead className="text-right text-slate-600 font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-slate-700">{user.nip}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">{user.nama}</p>
                      {user.email && (
                        <p className="text-sm text-slate-500">{user.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.jabatan || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.is_active ? 'default' : 'destructive'}
                      className={user.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                    >
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user)}
                        className="hover:bg-slate-100"
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4 text-red-500" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah informasi dan role user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nip">NIP</Label>
              <Input
                id="edit-nip"
                value={formData.nip}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="edit-nama">Nama Lengkap *</Label>
              <Input
                id="edit-nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Password Baru</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-pangkat">Pangkat</Label>
                <Input
                  id="edit-pangkat"
                  value={formData.pangkat}
                  onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-jabatan">Jabatan</Label>
                <Input
                  id="edit-jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Role *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-role-${role}`}
                      checked={formData.roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`edit-role-${role}`} className="text-sm">
                      {roleLabels[role]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
