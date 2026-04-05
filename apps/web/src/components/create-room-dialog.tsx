'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { roomApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hostName: '',
    maxParticipants: 25,
  })

  const createRoomMutation = useMutation({
    mutationFn: roomApi.createRoom,
    onSuccess: (data) => {
      onOpenChange(false)
      router.push(`/lobby?roomId=${data.id}&userName=${formData.hostName}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRoomMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إنشاء غرفة اجتماع جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل الغرفة وابدأ الاجتماع
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الغرفة</label>
            <Input
              required
              placeholder="اجتماع الفريق"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الوصف (اختياري)</label>
            <Input
              placeholder="مناقشة المشروع الجديد"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">اسمك</label>
            <Input
              required
              placeholder="أحمد محمد"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الحد الأقصى للمشاركين</label>
            <Input
              type="number"
              min={2}
              max={50}
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createRoomMutation.isPending}>
              {createRoomMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إنشاء الغرفة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
