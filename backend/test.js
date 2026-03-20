const { z } = require('zod');
const s = z.string().datetime();
try {
  s.parse(new Date().toISOString());
  console.log('Valid');
} catch (e) {
  console.log('Invalid', e.errors);
}
