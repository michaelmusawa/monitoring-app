import { redirect } from 'next/navigation';
import { getChecklistForProject } from '@/lib/actions/actions';

export default async function ChecklistPage({ params }: { params: { projectId: string } }) {
  const checklist = await getChecklistForProject(params.projectId);
  switch (checklist?.status) {
    case 'Draft':
      redirect(`/projects/${params.projectId}/checklist/draft`);
    case 'DraftReview':
      redirect(`/projects/${params.projectId}/checklist/draft-review`);
    case 'WeightsAssignment':
      redirect(`/projects/${params.projectId}/checklist/weights`);
    case 'WeightsReview':
      redirect(`/projects/${params.projectId}/checklist/weights-review`);
    case 'Approved':
      redirect(`/projects/${params.projectId}/checklist/finalized`);
    default:
      return <div>No checklist found</div>;
  }
}
