import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editForm: {
    username: string
  }
  onFormChange: (form: { username: string }) => void
  onSave: () => void
  onDeleteAccount: () => void
}

export default function EditProfileModal({
  open,
  onOpenChange,
  editForm,
  onFormChange,
  onSave,
  onDeleteAccount
}: EditProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-slate-900/40 border border-slate-700/50 shadow-2xl rounded-lg text-white">
        <DialogHeader>
          <DialogTitle className="font-['Pretendard'] text-white">프로필 수정</DialogTitle>
          <DialogDescription className="font-['Pretendard'] text-slate-300">
            사용자 이름을 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right text-slate-200 font-['Pretendard']">
              이름
            </Label>
            <Input
              id="username"
              value={editForm.username}
              onChange={(e) => onFormChange({ ...editForm, username: e.target.value })}
              placeholder="이름을 입력하세요"
              className="col-span-3 bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 font-['Pretendard'] focus:border-[#2563eb] focus:ring-[#2563eb]/20 transition-all duration-300"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            onClick={onDeleteAccount}
            variant="destructive"
            size="sm"
            className="sm:order-first bg-slate-600 hover:bg-slate-700 text-white font-['Pretendard'] font-medium transition-all duration-300 shadow-lg"
          >
            회원 탈퇴
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-400/40 text-slate-200 hover:bg-slate-700/50 hover:text-white font-['Pretendard'] transition-all duration-300">
              취소
            </Button>
            <Button onClick={onSave} className="bg-violet-600 hover:bg-violet-700 text-white font-['Pretendard'] font-medium transition-all duration-300 shadow-lg">
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}