import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, Settings } from "lucide-react"
import { useDictionary } from "@/components/admin/dictionary-provider"

export function OrdersOverview() {
  const dictionary = useDictionary()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{dictionary.dashboard.orders.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm mb-4">
          <ArrowUp className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-green-500 font-medium">24%</span>
          <span className="text-gray-500 ml-1">{dictionary.dashboard.orders.thisMonth}</span>
        </div>

        {/* Orders list would go here */}
      </CardContent>
    </Card>
  )
}
