import { SignupForm } from "@/components/auth/signup-form"
import Navbar from "@/components/common/navbar"

export default function SignupPage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />
      <div className="flex min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-6xl">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
