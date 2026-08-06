import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { FiSun, FiMoon, FiMenu, FiX, FiUser, FiChevronDown } from 'react-icons/fi';
import NavThread from './NavThread';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  const topLevelLinks = [
    { name: 'Places', path: '/places' },
    { name: 'AI Trip Planner', path: '/plan' },
    { name: 'Journal', path: '/journal' },
  ];

  const smartToolsLinks = [
    { name: 'Budget Forecaster', path: '/budget' },
    { name: 'Safety Checker', path: '/safety' },
    { name: 'AI Packing Assistant', path: '/packing' },
    { name: 'Landmark Detector', path: '/landmark' },
    { name: 'Travel News', path: '/news' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          ✈️ <span>Travel.IO</span>
        </Link>

        {/* Desktop Nav */}
        <div className="nav-links-wrapper">
          <ul className="nav-links desktop-only">
            {topLevelLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  className={location.pathname === link.path ? 'active' : ''}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            
            {/* Smart Tools Dropdown */}
            <li className="dropdown-container" ref={dropdownRef}>
              <button 
                className={`dropdown-toggle ${smartToolsLinks.some(link => location.pathname === link.path) ? 'active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                Smart Tools <FiChevronDown className={`chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-menu glass-card">
                  {smartToolsLinks.map((link) => (
                    <Link 
                      key={link.path}
                      to={link.path}
                      className={location.pathname === link.path ? 'active dropdown-item' : 'dropdown-item'}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          </ul>
          {/* Interactive Signature #4: NavThread */}
          <div className="desktop-only thread-container">
             <NavThread />
          </div>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          
          {user ? (
            <div className="user-menu desktop-only">
              <div className="credits-badge" title="AI Credits reset at midnight IST">
                ⚡ {user.credits !== undefined ? user.credits : '--'}
              </div>
              <Link to="/dashboard" className="user-profile">
                <FiUser /> <span>{user.name}</span>
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-outline-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Admin Panel</Link>
              )}
              <button onClick={logout} className="btn-outline">Logout</button>
            </div>
          ) : (
            <div className="auth-links desktop-only">
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu glass-card">
          <ul>
            {topLevelLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  className={location.pathname === link.path ? 'active' : ''}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            
            <li className="mobile-divider">Smart Tools</li>
            {smartToolsLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  className={location.pathname === link.path ? 'active mobile-sub-link' : 'mobile-sub-link'}
                >
                  — {link.name}
                </Link>
              </li>
            ))}

            <li className="mobile-divider">Account</li>
            {user ? (
              <>
                <li><Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link></li>
                {user.role === 'admin' && (
                <li className="mobile-divider" style={{marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
                  <Link to="/admin" className="btn-primary w-100" onClick={() => setIsOpen(false)}>Admin Panel</Link>
                </li>
              )}
              <li style={{marginTop: '1rem'}}>
                <button className="btn-outline w-100" onClick={() => { logout(); setIsOpen(false); }}>Logout</button>
              </li>
            </>
            ) : (
              <>
                <li><Link to="/login" onClick={() => setIsOpen(false)}>Login</Link></li>
                <li><Link to="/register" onClick={() => setIsOpen(false)}>Sign Up</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
