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
      <DialogContent className="sm:max-w-md bg-background border">
        <DialogHeader>
          <DialogTitle className="text-foreground">프로필 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-foreground">이름</Label>
            <Input
              id="username"
              value={editForm.username}
              onChange={(e) => onFormChange({ ...editForm, username: e.target.value })}
              className="bg-background border-input text-foreground"
            />
          </div>
          <Separator className="bg-border" />
          <div className="flex justify-between">
            <Button
              onClick={onDeleteAccount}
              variant="destructive"
              size="sm"
            >
              회원 탈퇴
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-input text-foreground hover:bg-accent"
              >
                취소
              </Button>
              <Button
                onClick={onSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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