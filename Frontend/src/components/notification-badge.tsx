interface NotificationBadgeProps {
  count: number
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
      {count > 9 ? "9+" : count}
    </div>
  )
}

