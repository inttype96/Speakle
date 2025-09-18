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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogDescription>
            사용자 이름을 변경할 수 있습니다. 변경사항은 즉시 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              이름
            </Label>
            <Input
              id="username"
              value={editForm.username}
              onChange={(e) => onFormChange({ ...editForm, username: e.target.value })}
              placeholder="이름을 입력하세요"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            onClick={onDeleteAccount}
            variant="destructive"
            size="sm"
            className="sm:order-first"
          >
            회원 탈퇴
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={onSave}>
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}