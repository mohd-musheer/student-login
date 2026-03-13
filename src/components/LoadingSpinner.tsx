import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
}
