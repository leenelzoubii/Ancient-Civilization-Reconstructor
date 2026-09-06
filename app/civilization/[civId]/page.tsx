import { GetServerSideProps } from 'next';
import ReconstructionView from '@/components/ReconstructionView';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { civId } = context.params;
  const { default: civilizations } = await import('@/data/civilizations.json');
  const civ = civilizations.civilizations.find(
    (c: any) => c.id === civId
  );

  if (!civ) {
    return { notFound: true };
  }

  return { props: { params: { civId } }, revalidate: 60 };
};

export default function CivilizationPage({
  params,
}: { params: { civId: string } }) {
  return <ReconstructionView params={params} />;
}