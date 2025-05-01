import { useState, Fragment, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, BookOpenIcon, ArrowRightOnRectangleIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import api from '../../utils/api';
import Notifications from '../Notifications';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Navbar = ({ user, setUser, isScrolled }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Отправляем запрос на сервер для логаута
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Ошибка при выходе из системы:', err);
    } finally {
      // Удаляем токен и информацию о пользователе независимо от результата запроса
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      navigate('/');
    }
  };

  return (
    <Disclosure as="nav" className={classNames(
      'w-full transition-all duration-300 z-10 sticky top-0',
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    )}>
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Логотип */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="flex items-center">
                    <BookOpenIcon className="h-8 w-8 text-primary-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900">BookStore</span>
                  </Link>
                </div>
              </div>
              
              {/* Профиль пользователя */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {/* Компонент уведомлений - только для авторизованных пользователей */}
                {user && <Notifications user={user} />}

                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Открыть меню пользователя</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-600" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Мой профиль
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile?tab=purchased"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Мои книги
                            </Link>
                          )}
                        </Menu.Item>
                        {user.role === 'admin' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Админ-панель
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full text-left px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Выйти
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center ml-4 space-x-2">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      Войти
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      to="/register"
                      className="text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      Регистрация
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar; 