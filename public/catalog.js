// El inventario y las fichas públicas se editan en content.js.
const content = window.PLUVIA_CONTENT;
export const modules = content?.modules || {};
export const categories = content?.catalogCategories || [];
export const materials = (content?.catalogRows || []).map(
  ([category, art, module, name, quantity, use]) => ({
    id: art, category: categories[category], module, name, quantity,
    definition: use || modules[module].description,
    spec: modules[module].spec, status: 'Previsto',
  }),
);
