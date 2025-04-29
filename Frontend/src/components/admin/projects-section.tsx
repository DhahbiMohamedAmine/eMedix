import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, MoreVertical } from "lucide-react"
import { useDictionary } from "@/components/admin/dictionary-provider"

export function ProjectsSection() {
  const dictionary = useDictionary()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{dictionary.dashboard.projects.title}</CardTitle>
        <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <MoreVertical className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm mb-4">
          <div className="flex items-center text-blue-500">
            <Check className="h-4 w-4 mr-2" />
            <span className="font-medium">30 {dictionary.dashboard.projects.done}</span>
          </div>
          <span className="text-gray-500 ml-1">{dictionary.dashboard.projects.thisMonth}</span>
        </div>

        {/* Project list would go here */}
      </CardContent>
    </Card>
  )
}
