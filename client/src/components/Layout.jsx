import { useState, useEffect } from 'react';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

const Layout = ({ children, user, setUser }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Эффект для отслеживания прокрутки страницы
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        user={user} 
        setUser={setUser} 
        isScrolled={isScrolled} 
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 