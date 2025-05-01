import { Link } from 'react-router-dom';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <BookOpenIcon className="h-20 w-20 text-primary-600 mx-auto" />
        <h1 className="mt-6 text-6xl font-extrabold text-gray-900">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">Страница не найдена</h2>
        <p className="mt-2 text-base text-gray-500">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 