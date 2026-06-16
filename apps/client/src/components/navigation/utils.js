import authService from '../../features/auth/auth.service';

const cleanPath = (path) => {
  if (!path) return '';
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
};

export const getLinks = (pathname) => {
  let links = [];
  const path = cleanPath(pathname);

  if (path === '/login') {
    links = links.concat({ name: 'Inicio', to: '/' });
    links = links.concat({ name: 'Registro', to: '/signup', isButton: true, isPrimary: true });
  }

  if (path === '/signup') {
    links = links.concat({ name: 'Inicio', to: '/' });
    links = links.concat({ name: 'Iniciar sesión', to: '/login', isButton: true });
  }

  if (path === '/') {
    links = links.concat({ name: 'Iniciar sesión', to: '/login', isButton: true });
    links = links.concat({ name: 'Registro', to: '/signup', isButton: true, isPrimary: true });
  }

  return links;
};

export const getButtons = (pathname) => {
  let buttons = [];
  const path = cleanPath(pathname);

  const privatePages = ['/inventory', '/dashboard', '/sales', '/history', '/settings', '/reports', '/invoice-preview'];
  if (privatePages.includes(path)) {
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
