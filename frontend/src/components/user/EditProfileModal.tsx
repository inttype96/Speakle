import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
      <DialogContent className="sm:max-w-md bg-background border-border shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-foreground text-lg font-semibold">프로필 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              이름
            </Label>
            <Input
              id="username"
              value={editForm.username}
              onChange={(e) => onFormChange({ ...editForm, username: e.target.value })}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="이름을 입력하세요"
            />
          </div>

          <Separator className="bg-border" />

          <div className="flex justify-between items-center pt-2">
            <Button
              onClick={onDeleteAccount}
              variant="destructive"
              size="sm"
              className="text-destructive-foreground hover:bg-destructive/90"
            >
              회원 탈퇴
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                size="sm"
              >
                취소
              </Button>
              <Button
                onClick={onSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                size="sm"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}