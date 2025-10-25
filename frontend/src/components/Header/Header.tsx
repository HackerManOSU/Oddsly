import React from 'react';

/* ++++++++++ NAVIGATION ++++++++++ */
import Logout from '../Account/Logout';
import { Link, useLocation } from 'react-router-dom';

/* ++++++++++ AUTHORIZATION ++++++++++ */
import useAuth from '../../authorization/useAuth';

/* ++++++++++ ANIMATIONS ++++++++++ */
import { motion, AnimatePresence } from 'framer-motion';

/* ++++++++++ ICONS ++++++++++ */
import { Settings } from 'lucide-react';

/* ++++++++++ STYLES ++++++++++ */
import './Header.css';

/*
interface HeaderProps {
  toggleNavbar: () => void;
}
*/

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if we're on the login page
  const isLoginPage = location.pathname === '/login';

  const headerVariants = {
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.1,
        ease: "easeOut"
      }
    },
    hidden: {
      y: "-100%",
      opacity: 0,
      transition: {
        duration: 0.1,
        ease: "easeIn"
      }
    }
  };

  return (
    <AnimatePresence>
      {!isLoginPage && (
        <motion.header
          className="header flex w-screen min-h-[90px] min-h-[8vh] justify-center px-4 py-1 relative z-20 bg-secondary"
          initial="visible"
          animate="visible"
          exit="hidden"
          variants={headerVariants}
        >
          <nav className="flex justify-center min-w-[400px] w-[70%] max-w-[1200px] items-center min-h-[90px]">
            <ul className="flex flex-col md:flex-row items-center justify-between w-full max-w-[1200px] h-full">
              <li className="flex-1 flex justify-start h-full">
                <Link to="/" className="h-full flex items-center">
                  <img src="/logo-header.png" alt="" className="h-[90px] w-auto object-contain"/>
                </Link>
              </li>

              <li className="flex-1 flex justify-end items-center space-x-4 pb-4 md:pb-0 text-white">
                {user ? (
                  <>
                    <Link 
                      to="/odds"
                      className="hover:text-neon transition-all duration-300 text-2xl"
                    >
                      Odds
                    </Link>
                    <Link
                      to="/profile"
                      className="hover:text-neon transition-all duration-300"
                    >
                      <Settings size={24} />
                    </Link>
                    <Logout />
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="hover:text-neon transition-all duration-300"
                  >
                    Login
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;