import TestRunner from '@/components/testbuilder/TestRunner'

export default function TestPage({ params }: { params: { id: string } }) {
  return <TestRunner sessionId={params.id} />
}
