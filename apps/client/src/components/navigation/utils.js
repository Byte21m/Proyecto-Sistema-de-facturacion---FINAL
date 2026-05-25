import authService from '../../features/auth/auth.service';

export const getLinks = (pathname) => {
  let links = [];

  if (pathname === '/login') {
    links = links.concat({ name: 'Inicio', to: '/' });
    links = links.concat({ name: 'Registro', to: '/signup', isButton: true, isPrimary: true });
  }

  if (pathname === '/signup') {
    links = links.concat({ name: 'Inicio', to: '/' });
    links = links.concat({ name: 'Iniciar sesión', to: '/login', isButton: true });
  }

  if (pathname === '/') {
    links = links.concat({ name: 'Iniciar sesión', to: '/login', isButton: true });
    links = links.concat({ name: 'Registro', to: '/signup', isButton: true, isPrimary: true });
  }

  return links;
};

export const getButtons = (pathname) => {
  let buttons = [];

  const privatePages = ['/inventory', '/dashboard', '/sales', '/history', '/settings', '/reports', '/invoice-preview'];
  if (privatePages.includes(pathname)) {
    buttons = buttons.concat({
      name: 'Cerrar sesión',
      handler: () => {
        authService.signOut();
        location.assign('/login');
      },
    });
  }

  return buttons;
};
