import { menu } from "../../../data-mock/menu.js";




export const getMatchedItems = (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().toLocaleLowerCase('en-US') : '';
    if (query.length < 2) {
      return response.status(400).json({ error: 'Enter at least two characters to find dishes.' });
    }

    const terms = query.split(/\s+/).filter((term) => term.length > 2);
    const ranked = menu
      .map((item) => {
        const searchable = `${item.name} ${item.description} ${item.restaurant} ${item.keywords.join(' ')}`.toLocaleLowerCase('en-US');
        const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
        return { item, score };
      })
      .sort((left, right) => right.score - left.score);

    const matching = ranked.filter(({ score }) => score > 0);
    const items = (matching.length ? matching : ranked).slice(0, 4).map(({ item }) => ({
      id: item.id,
      name: item.name,
      restaurant: item.restaurant,
      description: item.description,
      price: item.price,
      rating: item.rating,
      time: item.time,
      image: item.image,
      tag: item.tag,
    }));

    return response.json({ items });
  };