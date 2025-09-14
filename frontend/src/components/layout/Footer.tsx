import { Link } from 'react-router-dom';
import { Scale, Shield, Users, Gavel } from 'lucide-react';
import logoIcon from '/veritas.png';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-tertiary to-secondary text-tertiary-foreground">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logoIcon} alt="Veritas" className="h-8 w-8" />
              <span className="font-bold text-lg">Veritas</span>
            </div>
            <p className="text-tertiary-foreground/80 text-sm leading-relaxed">
              Revolutionizing justice through transparent, efficient, and accessible legal processes.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>
                <Link to="/register" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Gavel className="h-3 w-3" />
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register?role=lawyer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Join as Lawyer
                </Link>
              </li>
              <li>
                <Link to="/register?role=police" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Scale className="h-3 w-3" />
                  Join as Police
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>
                <span className="text-tertiary-foreground/60">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-tertiary-foreground/60">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-tertiary-foreground/60">
                  Compliance
                </span>
              </li>
              <li>
                <span className="text-tertiary-foreground/60">
                  Security
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>Emergency: 999</li>
              <li>Support: 1247</li>
              <li>Email: support@veritas.gov</li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-tertiary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-tertiary-foreground/60">
          <p>&copy; 2025 Veritas. All rights reserved.</p>
          <p>Powered by technology for fair justice.</p>
        </div>
      </div>
    </footer>
  );
};