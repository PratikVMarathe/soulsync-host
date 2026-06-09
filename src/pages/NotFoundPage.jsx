import { useNavigate } from 'react-router-dom';
import AppStatusView from '../components/AppStatusView';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppStatusView
      state={{
        statusCode: 404,
        title: 'Page Not Found',
        message: 'This page does not exist in SoulSync yet, or the link is no longer valid.',
      }}
      actions={[
        { label: 'Go Home', onClick: () => navigate('/') },
        { label: 'Go Back', onClick: () => window.history.back(), tone: 'secondary' },
      ]}
    />
  );
}
