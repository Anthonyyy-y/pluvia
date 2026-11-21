// Origen del servicio persistente, asignado durante el despliegue.
const backend = new URL(process.env.PLUVIA_API_ORIGIN || '');
if (backend.protocol !== 'https:' || backend.href !== backend.origin + '/') {
  throw new Error('PLUVIA_API_ORIGIN debe ser un origen HTTPS sin ruta ni credenciales.');
}
export const config = {
  framework: null,
  outputDirectory: 'public',
  installCommand: '',
  buildCommand: '',
  redirects: [
    { source: '/monitoreo', destination: backend.origin + '/monitoreo', permanent: false },
    { source: '/monitoreo/index.html', destination: backend.origin + '/monitoreo', permanent: false },
  ],
  rewrites: [
    { source: '/api/v1/contact', destination: backend.origin + '/api/v1/contact' },
  ],
};
