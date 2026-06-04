import { useNavigate } from 'react-router-dom';

export default function QuizCard({ title, description, route }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h4 className="font-bold text-gray-800 text-lg">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button 
        onClick={() => navigate(route)}
        className="mt-6 bg-[#2F4F4F] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#1f3636] transition-colors text-sm w-full"
      >
        Start Concept →
      </button>
    </div>
  );
}