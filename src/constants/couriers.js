export const COURIERS = [
  {
    slug: 'postex',
    name: 'PostEx',
    image: '/images/couriers/postex.png',
    placeholder: 'PostEx configuration options will appear here.'
  },
  {
    slug: 'leopard',
    name: 'Leopard',
    image: '/images/couriers/leopard.png',
    placeholder: 'Enter your Leopard API key and password to connect this courier.'
  },
  {
    slug: 'argo',
    name: 'Argo Courier',
    image: '/images/couriers/argo.png',
    placeholder: 'Argo Courier configuration options will appear here.'
  },
  {
    slug: 'dastaq',
    name: 'Dastaq',
    image: '/images/couriers/dastaq.png',
    placeholder: 'Dastaq configuration options will appear here.'
  }
];

export const getCourierBySlug = (slug) => COURIERS.find(c => c.slug === slug) ?? null;
export const getCourierName = (slug) => getCourierBySlug(slug)?.name ?? slug;
