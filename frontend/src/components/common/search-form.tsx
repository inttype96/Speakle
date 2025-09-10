import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";



export function SearchForm() {
    return (
        <div className="flex w-full max-w items-center gap-2 mb-6">
            <Input type="search" placeholder="노래 제목 입력" />
            <Button type="submit" variant="outline">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-500" /> 검색
            </Button>
        </div>
    )
}
