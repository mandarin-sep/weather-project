import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/tanstack-query')({
  component: DemoPage,
})

function DemoPage() {
  return <div />
}
